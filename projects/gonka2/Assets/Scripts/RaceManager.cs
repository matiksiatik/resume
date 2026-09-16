using UnityEngine;
using Mirror;
using System.Collections;

public class RaceManager : NetworkBehaviour
{
    public enum RaceState { WaitingForPlayers, Countdown, Racing, Finished }
    [SyncVar] public RaceState currentState = RaceState.WaitingForPlayers;
    [SyncVar] public int countdownSeconds = 3;

    public static RaceManager Instance;

    void Awake()
    {
        Instance = this;
    }

    public override void OnStartServer()
    {
        base.OnStartServer();
        StartCoroutine(WaitForPlayers());
    }

    [Server]
    IEnumerator WaitForPlayers()
    {
        // Ждём минимум 2 игроков (можно изменить на 1 для тестов)
        while (NetworkServer.connections.Count < 2)
            yield return null;

        currentState = RaceState.Countdown;
        for (int i = countdownSeconds; i > 0; i--)
        {
            RpcUpdateCountdown(i);
            yield return new WaitForSeconds(1f);
        }
        currentState = RaceState.Racing;
        RpcRaceStarted();
    }

    [ClientRpc]
    void RpcUpdateCountdown(int sec)
    {
        UIManager.Instance?.ShowCountdown(sec);
    }

    [ClientRpc]
    void RpcRaceStarted()
    {
        UIManager.Instance?.ShowRaceStarted();
    }
}