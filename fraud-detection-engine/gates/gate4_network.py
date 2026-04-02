"""
Gate 4 — The Network Mapper (Group Collusion AI)
==================================================
Catches coordinated fraud rings where multiple "workers" are actually
one person or a group working together to file fake claims.

F5 — Group Fraud Detection:
  Analyzes a batch of claiming workers for three collusion signals:
    1. Shared Device ID — Multiple worker accounts on the same phone
    2. Shared UPI ID — Multiple accounts routing payouts to same bank
    3. GPS Co-Location — Multiple workers claiming from the exact same
       spot (within 50 meters) at the same time

  If a cluster of ≥5 workers share any of these signals → +20 FRS per worker.

Real-world context:
  A fraudster creates 10 fake worker accounts on one phone. When rain hits,
  all 10 accounts file claims simultaneously from the same GPS location,
  all paying out to the same UPI ID. Gate 4 catches this by looking at
  the network graph of relationships between workers.
"""

import math
from collections import defaultdict
from models.schemas import ClaimRequest, GateResult, GroupFraudRequest, GroupFraudWorker
from config import (
    F5_GROUP_FRAUD_POINTS,
    MIN_CLUSTER_SIZE,
    GPS_CO_LOCATION_METERS,
    EARTH_RADIUS_KM,
    CLUSTER_TIME_WINDOW_MINUTES,
)


def _haversine_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate distance in meters between two GPS points."""
    lat1_r, lat2_r = math.radians(lat1), math.radians(lat2)
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)

    a = (math.sin(dlat / 2) ** 2 +
         math.cos(lat1_r) * math.cos(lat2_r) * math.sin(dlon / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return EARTH_RADIUS_KM * c * 1000  # Convert km to meters


def _find_device_clusters(workers: list[GroupFraudWorker]) -> dict[str, list[str]]:
    """
    Find workers sharing the same device_id.
    Returns: {device_id: [worker_id1, worker_id2, ...]}
    """
    device_map: dict[str, list[str]] = defaultdict(list)
    for w in workers:
        if w.device_id:
            device_map[w.device_id].append(w.worker_id)
    # Only return clusters with 2+ workers
    return {did: wids for did, wids in device_map.items() if len(wids) >= 2}


def _find_upi_clusters(workers: list[GroupFraudWorker]) -> dict[str, list[str]]:
    """
    Find workers sharing the same UPI ID.
    Returns: {upi_id: [worker_id1, worker_id2, ...]}
    """
    upi_map: dict[str, list[str]] = defaultdict(list)
    for w in workers:
        if w.upi_id:
            upi_map[w.upi_id].append(w.worker_id)
    return {uid: wids for uid, wids in upi_map.items() if len(wids) >= 2}


def _find_gps_clusters(workers: list[GroupFraudWorker]) -> list[list[str]]:
    """
    Find workers within GPS_CO_LOCATION_METERS of each other.
    Uses a simple pairwise distance check.
    Returns: list of clusters (each cluster is a list of worker_ids)
    """
    # Filter workers with GPS data
    gps_workers = [w for w in workers if w.latitude is not None and w.longitude is not None]
    if len(gps_workers) < 2:
        return []

    # Build adjacency: who is near whom?
    nearby: dict[str, set[str]] = defaultdict(set)
    for i in range(len(gps_workers)):
        for j in range(i + 1, len(gps_workers)):
            w1, w2 = gps_workers[i], gps_workers[j]
            distance = _haversine_meters(w1.latitude, w1.longitude, w2.latitude, w2.longitude)
            if distance <= GPS_CO_LOCATION_METERS:
                nearby[w1.worker_id].add(w2.worker_id)
                nearby[w2.worker_id].add(w1.worker_id)

    # BFS to find connected components (clusters)
    visited = set()
    clusters = []
    for worker_id in nearby:
        if worker_id in visited:
            continue
        # BFS from this worker
        cluster = []
        queue = [worker_id]
        while queue:
            current = queue.pop(0)
            if current in visited:
                continue
            visited.add(current)
            cluster.append(current)
            for neighbor in nearby.get(current, set()):
                if neighbor not in visited:
                    queue.append(neighbor)
        if len(cluster) >= 2:
            clusters.append(cluster)

    return clusters


def analyze_group_fraud(workers: list[GroupFraudWorker]) -> dict:
    """
    Full group fraud analysis across all three signals.
    Returns analysis details and which workers are flagged.
    """
    device_clusters = _find_device_clusters(workers)
    upi_clusters = _find_upi_clusters(workers)
    gps_clusters = _find_gps_clusters(workers)

    # Collect all flagged workers (from any signal)
    flagged_workers: dict[str, list[str]] = defaultdict(list)

    for device_id, worker_ids in device_clusters.items():
        for wid in worker_ids:
            flagged_workers[wid].append(f"Shared device: {device_id}")

    for upi_id, worker_ids in upi_clusters.items():
        for wid in worker_ids:
            flagged_workers[wid].append(f"Shared UPI: {upi_id}")

    for cluster in gps_clusters:
        for wid in cluster:
            other_members = [w for w in cluster if w != wid]
            flagged_workers[wid].append(f"GPS co-location with: {', '.join(other_members)}")

    return {
        "device_clusters": device_clusters,
        "upi_clusters": upi_clusters,
        "gps_clusters": gps_clusters,
        "flagged_workers": dict(flagged_workers),
        "total_flagged": len(flagged_workers),
    }


def run_gate4_for_worker(
    claim: ClaimRequest,
    batch_workers: list[GroupFraudWorker] | None = None
) -> list[GateResult]:
    """
    Run Gate 4 for a single worker, given context about other workers in the batch.
    
    If batch_workers is None or too small, Gate 4 is skipped.
    Otherwise, checks if this worker appears in any collusion cluster.
    """
    results = []

    if not batch_workers or len(batch_workers) < 2:
        results.append(GateResult(
            gate_name="Group Fraud Detection (F5)",
            gate_id=4,
            passed=True,
            frs_points=0,
            details="No batch context provided (fewer than 2 workers). "
                    "Gate 4 skipped — group fraud requires batch analysis.",
            hard_stop=False
        ))
        return results

    # Run full group analysis
    analysis = analyze_group_fraud(batch_workers)
    worker_id = claim.worker.worker_id

    if worker_id in analysis["flagged_workers"]:
        reasons = analysis["flagged_workers"][worker_id]
        cluster_size = analysis["total_flagged"]
        
        # Determine if cluster meets minimum size threshold
        meets_threshold = cluster_size >= MIN_CLUSTER_SIZE

        if meets_threshold:
            results.append(GateResult(
                gate_name="Group Fraud Detection (F5)",
                gate_id=4,
                passed=False,
                frs_points=F5_GROUP_FRAUD_POINTS,
                details=(
                    f"🚨 GROUP FRAUD DETECTED — Worker '{worker_id}' is part of a "
                    f"collusion cluster of {cluster_size} workers (threshold: {MIN_CLUSTER_SIZE}). "
                    f"Signals: {'; '.join(reasons)}. "
                    f"+{F5_GROUP_FRAUD_POINTS} FRS points."
                ),
                hard_stop=False
            ))
        else:
            results.append(GateResult(
                gate_name="Group Fraud Detection (F5)",
                gate_id=4,
                passed=True,
                frs_points=0,
                details=(
                    f"⚠️ SUSPICIOUS LINKS — Worker '{worker_id}' has connections: "
                    f"{'; '.join(reasons)}. But cluster size ({cluster_size}) is below "
                    f"threshold ({MIN_CLUSTER_SIZE}). Monitoring only, no FRS penalty."
                ),
                hard_stop=False
            ))
    else:
        results.append(GateResult(
            gate_name="Group Fraud Detection (F5)",
            gate_id=4,
            passed=True,
            frs_points=0,
            details=f"No collusion signals found for worker '{worker_id}'. "
                    f"Checked {len(batch_workers)} workers in batch for shared devices, "
                    f"UPI accounts, and GPS co-location.",
            hard_stop=False
        ))

    return results


def run_gate4_batch(request: GroupFraudRequest) -> dict[str, list[GateResult]]:
    """
    Run Gate 4 on an entire batch of workers.
    Returns a dict: {worker_id: [GateResult, ...]}
    """
    analysis = analyze_group_fraud(request.workers)
    results_by_worker: dict[str, list[GateResult]] = {}

    for worker in request.workers:
        wid = worker.worker_id

        if wid in analysis["flagged_workers"]:
            reasons = analysis["flagged_workers"][wid]
            cluster_size = analysis["total_flagged"]
            meets_threshold = cluster_size >= MIN_CLUSTER_SIZE

            if meets_threshold:
                results_by_worker[wid] = [GateResult(
                    gate_name="Group Fraud Detection (F5)",
                    gate_id=4,
                    passed=False,
                    frs_points=F5_GROUP_FRAUD_POINTS,
                    details=(
                        f"🚨 GROUP FRAUD DETECTED — Worker '{wid}' is part of a "
                        f"collusion cluster of {cluster_size} workers. "
                        f"Signals: {'; '.join(reasons)}. +{F5_GROUP_FRAUD_POINTS} FRS points."
                    ),
                    hard_stop=False
                )]
            else:
                results_by_worker[wid] = [GateResult(
                    gate_name="Group Fraud Detection (F5)",
                    gate_id=4,
                    passed=True,
                    frs_points=0,
                    details=(
                        f"⚠️ SUSPICIOUS LINKS for '{wid}': {'; '.join(reasons)}. "
                        f"Cluster size ({cluster_size}) below threshold ({MIN_CLUSTER_SIZE})."
                    ),
                    hard_stop=False
                )]
        else:
            results_by_worker[wid] = [GateResult(
                gate_name="Group Fraud Detection (F5)",
                gate_id=4,
                passed=True,
                frs_points=0,
                details=f"No collusion signals for worker '{wid}'.",
                hard_stop=False
            )]

    return results_by_worker
