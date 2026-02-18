using System.Text.Json;

namespace RespiraLibere.Api.Services;

public class AirPollenClient
{
    private readonly HttpClient _http;
    public AirPollenClient(HttpClient http) => _http = http;

    public record AirPollenSnapshot(double? Pm25, double? Pm10, double? UsAqi, double? GrassPollen, DateTimeOffset? Time);

    public async Task<AirPollenSnapshot?> GetAsync(double latitude, double longitude, CancellationToken ct = default)
    {
        try
        {
            var airUrl = $"https://air-quality-api.open-meteo.com/v1/air-quality?latitude={latitude}&longitude={longitude}&hourly=pm2_5,pm10,us_aqi";
            var pollenUrl = $"https://air-quality-api.open-meteo.com/v1/air-quality?latitude={latitude}&longitude={longitude}&hourly=grass_pollen";

            var airTask = _http.GetStringAsync(airUrl, ct);
            var pollenTask = _http.GetStringAsync(pollenUrl, ct);
            await Task.WhenAll(airTask, pollenTask);

            double? pm25 = null, pm10 = null, usAqi = null, grass = null;
            DateTimeOffset? time = null;

            void readAir(string json)
            {
                using var doc = JsonDocument.Parse(json);
                var root = doc.RootElement;
                if (root.TryGetProperty("hourly", out var hourly))
                {
                    pm25 = hourly.GetProperty("pm2_5").EnumerateArray().FirstOrDefault().TryGetDouble();
                    pm10 = hourly.GetProperty("pm10").EnumerateArray().FirstOrDefault().TryGetDouble();
                    usAqi = hourly.GetProperty("us_aqi").EnumerateArray().FirstOrDefault().TryGetDouble();
                    var timeStr = hourly.GetProperty("time").EnumerateArray().FirstOrDefault().GetString();
                    if (DateTimeOffset.TryParse(timeStr, out var t)) time = t;
                }
            }

            void readPollen(string json)
            {
                using var doc = JsonDocument.Parse(json);
                var root = doc.RootElement;
                if (root.TryGetProperty("hourly", out var hourly))
                {
                    grass = hourly.GetProperty("grass_pollen").EnumerateArray().FirstOrDefault().TryGetDouble();
                }
            }

            readAir(airTask.Result);
            readPollen(pollenTask.Result);

            return new AirPollenSnapshot(pm25, pm10, usAqi, grass, time);
        }
        catch
        {
            return null; // fail soft
        }
    }
}

static class JsonElementExtensions
{
    public static double? TryGetDouble(this JsonElement element)
    {
        return element.ValueKind switch
        {
            JsonValueKind.Number => element.TryGetDouble(out var v) ? v : null,
            JsonValueKind.String => double.TryParse(element.GetString(), out var v) ? v : null,
            _ => null
        };
    }
}
