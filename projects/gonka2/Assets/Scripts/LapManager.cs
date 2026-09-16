using System.Collections.Generic;
using UnityEngine;
using Mirror;

public class LapManager : NetworkBehaviour
{
    public static LapManager Instance;

    private Dictionary<uint, LapData> lapDataDict = new Dictionary<uint, LapData>();

    void Awake()
    {
        if (Instance == null) Instance = this;
        else Destroy(gameObject);
    }

    void Start()
    {
        Debug.Log($"[LapManager] Start. isServer={isServer}, isClient={isClient}, netId={netId}");
    }

    public void StartFirstLap(NetworkIdentity playerIdentity)
    {
        if (!isServer) return;

        uint netId = playerIdentity.netId;
        if (!lapDataDict.ContainsKey(netId))
            lapDataDict[netId] = new LapData();

        lapDataDict[netId].lapStartTime = Time.time;
        Debug.Log($"[LapManager] Игрок {netId}: первый круг начат, lapStartTime={Time.time:F2}");
    }

    public void OnPlayerCrossFinish(NetworkIdentity playerIdentity)
    {
        if (!isServer) return;

        uint netId = playerIdentity.netId;
        Debug.Log($"[LapManager] Игрок {netId} пересёк финиш");

        if (!lapDataDict.ContainsKey(netId))
        {
            lapDataDict[netId] = new LapData();
            lapDataDict[netId].lapStartTime = Time.time;
            Debug.Log($"[LapManager] Созданы новые данные для игрока {netId}");
            return;
        }

        LapData data = lapDataDict[netId];
        float currentTime = Time.time;

        if (data.lapStartTime > 0)
        {
            float lapTime = currentTime - data.lapStartTime;
            data.lapTimes.Add(lapTime);
            data.bestLapTime = Mathf.Min(data.bestLapTime, lapTime);
            int lapCount = data.lapTimes.Count;

            Debug.Log($"[LapManager] Игрок {netId}: круг {lapCount}, время={lapTime:F2}, лучшее={data.bestLapTime:F2}");

            // Обновляем UI напрямую (для Host) и через RPC (для клиентов)
            UpdatePlayerUI(netId, lapTime, data.bestLapTime, lapCount);
            RpcUpdateLapTimes(netId, lapTime, data.bestLapTime, lapCount);
        }

        data.lapStartTime = currentTime;
    }

    // Прямой вызов UI для Host-режима
    void UpdatePlayerUI(uint netId, float lastLapTime, float bestLapTime, int lapCount)
    {
        Debug.Log($"[LapManager] UpdatePlayerUI: netId={netId}, localNetId={NetworkClient.localPlayer?.netId}");

        if (NetworkClient.localPlayer != null && NetworkClient.localPlayer.netId == netId)
        {
            Debug.Log($"[LapManager] Вызываю UIManager.UpdateLapTimes напрямую");
            UIManager.Instance?.UpdateLapTimes(lastLapTime, bestLapTime, lapCount);
        }
    }

    [ClientRpc]
    void RpcUpdateLapTimes(uint netId, float lastLapTime, float bestLapTime, int lapCount)
    {
        Debug.Log($"[Client] RpcUpdateLapTimes: netId={netId}, localNetId={NetworkClient.localPlayer?.netId}");

        if (NetworkClient.localPlayer != null && NetworkClient.localPlayer.netId == netId)
        {
            Debug.Log($"[Client] Вызываю UIManager.UpdateLapTimes");
            UIManager.Instance?.UpdateLapTimes(lastLapTime, bestLapTime, lapCount);
        }
    }
}

public class LapData
{
    public float lapStartTime = 0f;
    public List<float> lapTimes = new List<float>();
    public float bestLapTime = float.MaxValue;
}