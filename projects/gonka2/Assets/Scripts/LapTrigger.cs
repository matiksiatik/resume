using UnityEngine;
using Mirror;

public class LapTrigger : MonoBehaviour
{
    void OnTriggerEnter(Collider other)
    {
        NetworkIdentity netID = other.GetComponentInParent<NetworkIdentity>();
        
        if (netID == null)
        {
            Debug.LogWarning($"LapTrigger: объект {other.name} не имеет NetworkIdentity в иерархии");
            return;
        }

        if (netID.isLocalPlayer)
        {
            Debug.Log($"LapTrigger: локальный игрок {netID.name} пересёк финиш");
            CarController car = netID.GetComponent<CarController>();
            if (car != null)
            {
                car.CmdReportLap();
            }
            else
            {
                Debug.LogError($"LapTrigger: на {netID.name} нет CarController!");
            }
        }
    }
}