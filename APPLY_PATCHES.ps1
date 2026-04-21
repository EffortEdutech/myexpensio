# =============================================================
# UI Patch — Vehicle Type + Motorcycle Rate
# Run from monorepo root
# =============================================================
# Patches:
#   1. apps/user/app/(app)/settings/page.tsx   — motorcycle rate field
#   2. apps/user/app/(app)/trips/plan/page.tsx — vehicle_type selector + API param
#   3. apps/user/app/(app)/trips/start/page.tsx — vehicle_type passed to API
# =============================================================

function Patch-File($path, $oldText, $newText, $description) {
  if (-not (Test-Path $path)) {
    Write-Host "  MISSING  → $path" -ForegroundColor DarkGray
    return
  }
  $content = Get-Content $path -Raw -Encoding UTF8
  if ($content.Contains($oldText)) {
    $fixed = $content.Replace($oldText, $newText)
    Set-Content $path $fixed -NoNewline -Encoding UTF8
    Write-Host "  PATCHED  → $path" -ForegroundColor Green
    Write-Host "             $description" -ForegroundColor DarkGray
  } else {
    Write-Host "  SKIPPED  → $path (pattern not found)" -ForegroundColor Yellow
    Write-Host "             $description" -ForegroundColor DarkGray
  }
}

Write-Host "`n=== PATCH 1: settings/page.tsx — motorcycle rate ===" -ForegroundColor Cyan
$settingsFile = "apps\user\app\(app)\settings\page.tsx"

# 1a — Add motorcycle state variable after mileage state
Patch-File $settingsFile `
  "  const [mileage, setMileage] = useState('0.60')" `
  "  const [mileage, setMileage] = useState('0.60')`n  const [motorcycle, setMotorcycle] = useState('0.30')" `
  "Add motorcycle rate state"

# 1b — Load motorcycle from API response (in useEffect loadAll)
Patch-File $settingsFile `
  "          setMileage(f2(rate?.mileage_rate_per_km ?? 0.6))" `
  "          setMileage(f2(rate?.mileage_rate_per_km ?? 0.6))`n          setMotorcycle(f2(rate?.motorcycle_rate_per_km ?? 0.30))" `
  "Load motorcycle rate from API"

# 1c — Apply template also copies motorcycle rate
Patch-File $settingsFile `
  "    setMileage(f2(template.mileage_rate_per_km))" `
  "    setMileage(f2(template.mileage_rate_per_km))`n    setMotorcycle(f2(template.motorcycle_rate_per_km ?? 0.30))" `
  "Apply template fills motorcycle rate"

# 1d — Include motorcycle in save payload
Patch-File $settingsFile `
  "          mileage_rate_per_km: parseFloat(mileage) || 0.6," `
  "          mileage_rate_per_km: parseFloat(mileage) || 0.6,`n          motorcycle_rate_per_km: parseFloat(motorcycle) || 0.30," `
  "POST includes motorcycle_rate_per_km"

# 1e — Update ratesPreview to show motorcycle
Patch-File $settingsFile `
  "    ``Mileage MYR `${mileage || '0.00'}/km``," `
  "    ``Mileage MYR `${mileage || '0.00'}/km · Moto MYR `${motorcycle || '0.00'}/km``," `
  "ratesPreview shows both rates"

# 1f — Replace the mileage rate card to include motorcycle
$oldMileageCard = @'
          <Card icon="🚗" title="Mileage Rate" sub="Used for mileage claim item calculation.">
            <RateRow label="Rate per km" suffix="/km" value={mileage} onChange={(v) => num(v, setMileage)} />
          </Card>
'@
$newMileageCard = @'
          <Card icon="🚗" title="Mileage Rates" sub="Used for mileage claim item calculation. Select vehicle type per trip.">
            <RateRow label="🚗 Car rate per km" suffix="/km" value={mileage} onChange={(v) => num(v, setMileage)} />
            <RateRow label="🏍 Motorcycle rate per km" suffix="/km" value={motorcycle} onChange={(v) => num(v, setMotorcycle)} />
            <div style={S.info}>Set both rates. Users choose 🚗 Car or 🏍 Motorcycle when creating each trip.</div>
          </Card>
'@
Patch-File $settingsFile $oldMileageCard $newMileageCard "Mileage card now shows both car + motorcycle fields"


Write-Host "`n=== PATCH 2: trips/plan/page.tsx — vehicle_type ===" -ForegroundColor Cyan
$planFile = "apps\user\app\(app)\trips\plan\page.tsx"

# 2a — Add vehicleType state (place near other state declarations at top of component)
Patch-File $planFile `
  "  const [error, setError] = useState<string | null>(null)" `
  "  const [error, setError] = useState<string | null>(null)`n  const [vehicleType, setVehicleType] = useState<'car' | 'motorcycle'>('car')" `
  "Add vehicleType state"

# 2b — Add vehicle_type to the POST /api/trips call inside handleAddToTrips
Patch-File $planFile `
  "          calculation_mode: 'SELECTED_ROUTE',`n          origin_text:      origin.text,`n          destination_text: destination.text,`n          started_at:       startedAt," `
  "          calculation_mode: 'SELECTED_ROUTE',`n          origin_text:      origin.text,`n          destination_text: destination.text,`n          started_at:       startedAt,`n          vehicle_type:     vehicleType," `
  "Pass vehicle_type to trip creation API"

# 2c — Add vehicle selector UI before the Calculate Route button
Patch-File $planFile `
  "          <button`n            type=""submit""`n            style={{ ...S.btnCalculate, opacity: canCalculate ? 1 : 0.45 }}`n            disabled={!canCalculate}" `
  "          {/* Vehicle type selector */}`n          <div style={{ display: 'flex', gap: 10, marginBottom: 6 }}>`n            {(['car', 'motorcycle'] as const).map(v => (`n              <button`n                key={v} type=""button""`n                onClick={() => setVehicleType(v)}`n                style={{`n                  flex: 1, padding: '10px 8px', borderRadius: 8, cursor: 'pointer',`n                  border: vehicleType === v ? '2px solid #2563eb' : '1.5px solid #e2e8f0',`n                  backgroundColor: vehicleType === v ? '#eff6ff' : '#fff',`n                  color: vehicleType === v ? '#1d4ed8' : '#374151',`n                  fontWeight: vehicleType === v ? 700 : 500,`n                  fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,`n                }}`n              >`n                {v === 'car' ? '🚗 Car' : '🏍 Motorcycle'}`n              </button>`n            ))}`n          </div>`n          <button`n            type=""submit""`n            style={{ ...S.btnCalculate, opacity: canCalculate ? 1 : 0.45 }}`n            disabled={!canCalculate}" `
  "Add vehicle type selector above Calculate Route button"


Write-Host "`n=== PATCH 3: trips/start/page.tsx — vehicle_type ===" -ForegroundColor Cyan
$startFile = "apps\user\app\(app)\trips\start\page.tsx"

# 3a — Add vehicleType state
Patch-File $startFile `
  "  const router = useRouter()" `
  "  const router = useRouter()`n  const [vehicleType, setVehicleType] = useState<'car' | 'motorcycle'>('car')" `
  "Add vehicleType state to GPS start page"

# 3b — Pass vehicle_type when creating the GPS trip (POST /api/trips)
# GPS trips call POST /api/trips with calculation_mode: 'GPS_TRACKING'
# Find the GPS trip insert and add vehicle_type
Patch-File $startFile `
  "          calculation_mode: 'GPS_TRACKING'," `
  "          calculation_mode: 'GPS_TRACKING',`n          vehicle_type: vehicleType," `
  "Pass vehicle_type to GPS trip creation"

# 3c — Add vehicle selector UI (show before/during trip start, not during tracking)
# Find a good anchor — the "Start Trip" button area or the initial state render
Patch-File $startFile `
  "        {state === 'idle' && (" `
  "        {/* Vehicle type selector — shown before starting */)}`n        {state === 'idle' && (`n          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>`n            {(['car', 'motorcycle'] as const).map(v => (`n              <button`n                key={v} type=""button""`n                onClick={() => setVehicleType(v)}`n                style={{`n                  flex: 1, padding: '10px 8px', borderRadius: 8, cursor: 'pointer',`n                  border: vehicleType === v ? '2px solid #2563eb' : '1.5px solid #e2e8f0',`n                  backgroundColor: vehicleType === v ? '#eff6ff' : '#fff',`n                  color: vehicleType === v ? '#1d4ed8' : '#374151',`n                  fontWeight: vehicleType === v ? 700 : 500,`n                  fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,`n                }}`n              >`n                {v === 'car' ? '🚗 Car' : '🏍 Motorcycle'}`n              </button>`n            ))}`n          </div>`n        )}`n        {state === 'idle' && (" `
  "Add vehicle selector before GPS start button"


Write-Host "`n=== FINAL SCAN: confirm vehicle_type references ===" -ForegroundColor Cyan
$files = @($settingsFile, $planFile, $startFile, "apps\user\app\(app)\trips\odometer\page.tsx")
foreach ($f in $files) {
  if (Test-Path $f) {
    $hasVehicle = (Get-Content $f -Raw) -match "vehicleType|vehicle_type"
    $status = if ($hasVehicle) { "✅ HAS vehicle_type" } else { "⚠️  MISSING vehicle_type" }
    Write-Host "  $status → $f" -ForegroundColor $(if ($hasVehicle) { 'Green' } else { 'Red' })
  } else {
    Write-Host "  NOT FOUND → $f" -ForegroundColor DarkGray
  }
}
Write-Host ""
