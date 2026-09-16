using UnityEngine;
using TMPro;
using UnityEngine.UI;
using System.Collections;

public class UIManager : MonoBehaviour
{
    public static UIManager Instance;

    [Header("Элементы HUD")]
    public TextMeshProUGUI speedText;
    public TextMeshProUGUI lapTimeText;
    public TextMeshProUGUI bestLapText;
    public TextMeshProUGUI lapCountText;
    public TextMeshProUGUI countdownText;
    public Slider driftSlider;

    void Awake()
    {
        Instance = this;
        Debug.Log($"[UIManager] Awake. Instance={Instance.name}");
    }

    void Start()
    {
        // Авто-поиск, если ссылки пустые
        if (speedText == null) speedText = GameObject.Find("SpeedText")?.GetComponent<TextMeshProUGUI>();
        if (lapTimeText == null) lapTimeText = GameObject.Find("LapTimeText")?.GetComponent<TextMeshProUGUI>();
        if (bestLapText == null) bestLapText = GameObject.Find("BestLapText")?.GetComponent<TextMeshProUGUI>();
        if (lapCountText == null) lapCountText = GameObject.Find("LapCountText")?.GetComponent<TextMeshProUGUI>();
        if (driftSlider == null) driftSlider = GameObject.Find("DriftSlider")?.GetComponent<Slider>();

        Debug.Log($"[UIManager] Start. speedText={speedText?.name}, lapTimeText={lapTimeText?.name}, bestLapText={bestLapText?.name}, lapCountText={lapCountText?.name}");
    }

    public void UpdateSpeed(float speedKmh)
    {
        if (speedText != null)
            speedText.text = $"Speed: {speedKmh:F0} km/h";
    }

    public void UpdateDriftBar(float normalizedCharge)
    {
        if (driftSlider != null)
            driftSlider.value = normalizedCharge;
    }

    public void UpdateLapTimes(float lastLapTime, float bestLapTime, int lapCount)
    {
        Debug.Log($"[UIManager] UpdateLapTimes: last={lastLapTime:F2}, best={bestLapTime:F2}, count={lapCount}");

        if (lapTimeText != null)
        {
            lapTimeText.text = $"Lap: {FormatTime(lastLapTime)}";
            Debug.Log($"[UIManager] lapTimeText.text = {lapTimeText.text}");
        }
        else
        {
            Debug.LogError("[UIManager] lapTimeText == null! Пробую найти...");
            lapTimeText = GameObject.Find("LapTimeText")?.GetComponent<TextMeshProUGUI>();
            if (lapTimeText != null) lapTimeText.text = $"Lap: {FormatTime(lastLapTime)}";
        }

        if (bestLapText != null)
        {
            bestLapText.text = $"Best: {FormatTime(bestLapTime)}";
            Debug.Log($"[UIManager] bestLapText.text = {bestLapText.text}");
        }
        else
        {
            Debug.LogError("[UIManager] bestLapText == null! Пробую найти...");
            bestLapText = GameObject.Find("BestLapText")?.GetComponent<TextMeshProUGUI>();
            if (bestLapText != null) bestLapText.text = $"Best: {FormatTime(bestLapTime)}";
        }

        if (lapCountText != null)
        {
            lapCountText.text = $"Lap: {lapCount}";
            Debug.Log($"[UIManager] lapCountText.text = {lapCountText.text}");
        }
        else
        {
            Debug.LogError("[UIManager] lapCountText == null! Пробую найти...");
            lapCountText = GameObject.Find("LapCountText")?.GetComponent<TextMeshProUGUI>();
            if (lapCountText != null) lapCountText.text = $"Lap: {lapCount}";
        }
    }

    public void ShowCountdown(int sec)
    {
        if (countdownText != null)
        {
            countdownText.enabled = true;
            countdownText.text = sec.ToString();
        }
    }

    public void ShowRaceStarted()
    {
        if (countdownText != null)
        {
            countdownText.text = "GO!";
            StartCoroutine(HideGoAfterDelay());
        }
    }

    IEnumerator HideGoAfterDelay()
    {
        yield return new WaitForSeconds(1f);
        if (countdownText != null) countdownText.enabled = false;
    }

    private string FormatTime(float seconds)
    {
        int mins = Mathf.FloorToInt(seconds / 60);
        int secs = Mathf.FloorToInt(seconds % 60);
        int millis = Mathf.FloorToInt((seconds * 1000) % 1000);
        return $"{mins}:{secs:00}.{millis:000}";
    }
}