using UnityEngine;
using Mirror;
using UnityEngine.InputSystem;
using Unity.Cinemachine;

public class CarController : NetworkBehaviour
{
    [Header("Характеристики машины")]
    public float carMass = 1200f;
    public float horsePower = 200f;
    public float maxSpeedBase = 150f;
    public float maxSpeedPowerFactor = 300f;

    [Header("Настройки управления")]
    public float brakeForceCoeff = 0.01f;
    public float maxSteerAngle = 35f;
    public float driftSteerMultiplier = 1.8f;
    public float lateralDampingCoeff = 0.0005f;
    public float driftLateralDampingCoeff = 0.0001f;
    public float boostForceCoeff = 0.03f;
    public float reverseSpeedLimit = 10f;

    [Header("Дрифт и буст")]
    public float maxDriftCharge = 3f;

    [Header("Колёса (для анимации)")]
    public Transform[] frontWheels;
    public Transform[] rearWheels;
    public float wheelRadius = 0.35f;

    [SyncVar(hook = nameof(OnDriftChargeChanged))]
    private float driftCharge = 0f;

    [SyncVar]
    private bool isBoosting = false;

    private Rigidbody rb;
    private float verticalInput;
    private float horizontalInput;
    private bool driftInput;
    private bool boostInput;
    private bool isReversing = false;
    private bool isBraking = false;
    private bool lapStarted = false;

    private CarInputActions inputActions;
    private float maxSpeedMs;
    private float maxSpeedKmh;
    private float motorForce;
    private float effectiveBrakeForce;
    private float effectiveLateralDamping;
    private float effectiveDriftLateralDamping;
    private float effectiveBoostForce;
    private bool isInitialized = false;

    void Awake()
    {
        rb = GetComponent<Rigidbody>();
        if (rb == null)
        {
            Debug.LogError("Rigidbody не найден на объекте!");
            return;
        }

        rb.mass = 1f;
        rb.linearDamping = 0f;
        rb.angularDamping = 3f;
        rb.useGravity = true;
        rb.isKinematic = false;
        rb.interpolation = RigidbodyInterpolation.Interpolate;
        rb.collisionDetectionMode = CollisionDetectionMode.ContinuousDynamic;
        rb.constraints = RigidbodyConstraints.FreezeRotationX | RigidbodyConstraints.FreezeRotationZ;

        inputActions = new CarInputActions();
    }

    void InitializeCarStats()
    {
        if (isInitialized) return;
        isInitialized = true;

        // Логарифмическая формула: сглаживает разницу между малыми и большими л.с.
        // 200 л.с. → ~43,  500 л.с. → ~68,  1500 л.с. → ~102
        motorForce = (Mathf.Log(horsePower + 1) * 50f) / (carMass / 100f);
        maxSpeedKmh = maxSpeedBase + (horsePower / carMass) * maxSpeedPowerFactor;
        maxSpeedMs = maxSpeedKmh / 3.6f;

        effectiveBrakeForce = brakeForceCoeff * carMass;
        effectiveLateralDamping = lateralDampingCoeff * carMass;
        effectiveDriftLateralDamping = driftLateralDampingCoeff * carMass;
        effectiveBoostForce = boostForceCoeff * carMass;

        Debug.Log($"Масса: {carMass}кг, Л.с.: {horsePower}, Motor: {motorForce:F1}, MaxSpeed: {maxSpeedKmh:F0} км/ч");
    }

    void OnEnable()
    {
        if (inputActions != null)
            inputActions.Car.Enable();
    }

    void OnDisable()
    {
        if (inputActions != null)
            inputActions.Car.Disable();
    }

    void Update()
    {
        if (!isLocalPlayer) return;

        Vector2 moveInput = inputActions.Car.Move.ReadValue<Vector2>();
        verticalInput = moveInput.y;
        horizontalInput = moveInput.x;
        driftInput = inputActions.Car.Drift.IsPressed();
        boostInput = inputActions.Car.Boost.WasPressedThisFrame();

        float forwardSpeed = Vector3.Dot(rb.linearVelocity, transform.forward);

        isBraking = false;
        isReversing = false;

        if (verticalInput > 0.1f) { }
        else if (verticalInput < -0.1f)
        {
            if (forwardSpeed > 1f) isBraking = true;
            else isReversing = true;
        }

        if (driftInput)
        {
            float newCharge = driftCharge + Time.deltaTime;
            if (newCharge > maxDriftCharge) newCharge = maxDriftCharge;
            CmdUpdateDriftCharge(newCharge);
        }
        else if (driftCharge < maxDriftCharge)
            CmdUpdateDriftCharge(0f);

        if (boostInput && driftCharge >= maxDriftCharge)
            CmdActivateBoost();

        if (UIManager.Instance != null)
            UIManager.Instance.UpdateSpeed(Mathf.Abs(forwardSpeed) * 3.6f);
    }

    void FixedUpdate()
    {
        if (!isLocalPlayer || rb == null) return;
        if (!isInitialized) InitializeCarStats();

        float forwardSpeed = Vector3.Dot(rb.linearVelocity, transform.forward);
        float currentSpeedKmh = Mathf.Abs(forwardSpeed) * 3.6f;

        if (verticalInput > 0.1f && forwardSpeed < maxSpeedMs)
        {
            rb.AddForce(transform.forward * motorForce, ForceMode.Force);
        }
        else if (isBraking)
        {
            rb.AddForce(-transform.forward * effectiveBrakeForce, ForceMode.Force);
        }
        else if (isReversing)
        {
            if (forwardSpeed > -reverseSpeedLimit)
                rb.AddForce(-transform.forward * motorForce, ForceMode.Force);
            return;
        }
        else if (currentSpeedKmh > 0.5f && Mathf.Abs(verticalInput) < 0.1f)
        {
            float baseResistance = carMass / 100000f;
            float speedRatio = currentSpeedKmh / maxSpeedKmh;
            float dynamicResistance = baseResistance * (0.1f + 3.0f * speedRatio * speedRatio);

            Vector3 resistance = -transform.forward * Mathf.Sign(forwardSpeed) * dynamicResistance;
            rb.AddForce(resistance, ForceMode.Force);
        }

        if (rb.linearVelocity.magnitude > 1f)
        {
            float steer = horizontalInput * maxSteerAngle;
            if (driftInput) steer *= driftSteerMultiplier;
            float turnSpeed = steer * Time.fixedDeltaTime * 2f;
            if (forwardSpeed < -0.5f) turnSpeed *= -1f;
            transform.Rotate(Vector3.up * turnSpeed);
        }

        Vector3 right = transform.right;
        float lateralSpeed = Vector3.Dot(rb.linearVelocity, right);
        float damping = driftInput ? effectiveDriftLateralDamping : effectiveLateralDamping;
        rb.linearVelocity -= right * lateralSpeed * Mathf.Min(damping, 0.5f);

        if (rb.linearVelocity.magnitude > maxSpeedMs * 1.1f)
        {
            rb.linearVelocity = rb.linearVelocity.normalized * maxSpeedMs;
        }

        if (isBoosting)
        {
            Vector3 boostDir = forwardSpeed >= 0 ? transform.forward : -transform.forward;
            rb.AddForce(boostDir * effectiveBoostForce, ForceMode.VelocityChange);
            if (isLocalPlayer) CmdDeactivateBoost();
        }
    }

    void LateUpdate()
    {
        if (!isLocalPlayer) return;
        AnimateWheels();
    }

    public override void OnStartLocalPlayer()
    {
        base.OnStartLocalPlayer();
        CameraFollow camFollow = Camera.main?.GetComponent<CameraFollow>();
        if (camFollow != null)
            camFollow.target = transform;

        CmdStartFirstLap();
    }


    void AnimateWheels()
    {
        if (frontWheels == null || rearWheels == null) return;
        float speed = rb.linearVelocity.magnitude;
        float rpm = (speed / (2 * Mathf.PI * wheelRadius)) * 60f;
        float rotationThisFrame = rpm * 6f * Time.deltaTime;
        float forwardSpeed = Vector3.Dot(rb.linearVelocity, transform.forward);
        foreach (Transform wheel in frontWheels)
        {
            if (wheel == null) continue;
            float dir = forwardSpeed >= 0 ? 1f : -1f;
            wheel.Rotate(Vector3.right, rotationThisFrame * dir);
            wheel.localRotation = Quaternion.Euler(wheel.localRotation.eulerAngles.x, horizontalInput * maxSteerAngle, 0);
        }
        foreach (Transform wheel in rearWheels)
        {
            if (wheel == null) continue;
            float dir = forwardSpeed >= 0 ? 1f : -1f;
            wheel.Rotate(Vector3.right, rotationThisFrame * dir);
        }
    }

    [Command] void CmdUpdateDriftCharge(float value) => driftCharge = value;
    [Command] void CmdActivateBoost() { isBoosting = true; driftCharge = 0f; }
    [Command] void CmdDeactivateBoost() => isBoosting = false;

    [Command]
    public void CmdReportLap()
    {
        if (LapManager.Instance != null)
        {
            LapManager.Instance.OnPlayerCrossFinish(netIdentity);
            lapStarted = true;
        }
    }

    [Command]
    void CmdStartFirstLap()
    {
        if (LapManager.Instance != null && !lapStarted)
        {
            LapManager.Instance.StartFirstLap(netIdentity);
            lapStarted = true;
        }
    }

    void OnDriftChargeChanged(float oldValue, float newValue)
    {
        if (isLocalPlayer && UIManager.Instance != null)
            UIManager.Instance.UpdateDriftBar(newValue / maxDriftCharge);
    }
}