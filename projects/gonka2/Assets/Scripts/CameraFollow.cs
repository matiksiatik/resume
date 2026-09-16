using UnityEngine;

public class CameraFollow : MonoBehaviour
{
    public Transform target;                          // корень машины
    public Vector3 offset = new Vector3(0, 3, -8);   // сзади и сверху
    public float targetSmoothTime = 0.1f;             // плавность цели (больше = мягче)
    public float lookHeight = 1.5f;

    private Vector3 smoothedTargetPos;
    private Vector3 smoothVelocity;

    void Start()
    {
        if (target != null)
            smoothedTargetPos = target.position;
    }

    void LateUpdate()
    {
        if (target == null) return;

        // Плавно двигаем цель к реальной позиции машины
        smoothedTargetPos = Vector3.SmoothDamp(
            smoothedTargetPos,
            target.position,
            ref smoothVelocity,
            targetSmoothTime
        );

        // Жёстко ставим камеру относительно сглаженной позиции
        transform.position = smoothedTargetPos + target.TransformDirection(offset);

        // Смотрим на сглаженную точку
        Vector3 lookTarget = smoothedTargetPos + Vector3.up * lookHeight;
        transform.LookAt(lookTarget);
    }
}