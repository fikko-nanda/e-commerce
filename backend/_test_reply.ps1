$base = "http://127.0.0.1:8765/api/v1"

# Login
$b = Invoke-RestMethod -Uri "$base/auth/login/" -Method Post -ContentType "application/json" -Body '{"email":"buyer@t.com","password":"x12345678"}'
$s = Invoke-RestMethod -Uri "$base/auth/login/" -Method Post -ContentType "application/json" -Body '{"email":"seller@t.com","password":"x12345678"}'
$bt = $b.access_token
$st = $s.access_token
$bid = $b.user.id
$sid = $s.user.id
Write-Output "BUYER: $bid"
Write-Output "SELLER: $sid"

# Seller sends to buyer
Write-Output "`n=== Seller sends to buyer ==="
$body = @{ message = "Halo buyer, ini dari seller"; receiver_id = $bid } | ConvertTo-Json
$h = @{ Authorization = "Bearer $st" }
try {
    $r = Invoke-RestMethod -Uri "$base/chats/send/" -Method Post -Headers $h -ContentType "application/json" -Body $body
    Write-Output "SUCCESS: $($r | ConvertTo-Json -Depth 3)"
} catch {
    Write-Output "FAIL: $($_.Exception.Message)"
}

# Buyer replies to seller
Write-Output "`n=== Buyer replies to seller ==="
$body = @{ message = "Halo seller, balasan dari buyer"; receiver_id = $sid } | ConvertTo-Json
$h = @{ Authorization = "Bearer $bt" }
try {
    $r = Invoke-RestMethod -Uri "$base/chats/send/" -Method Post -Headers $h -ContentType "application/json" -Body $body
    Write-Output "SUCCESS: $($r | ConvertTo-Json -Depth 3)"
} catch {
    Write-Output "FAIL: $($_.Exception.Message)"
    if ($_.ErrorDetails) { Write-Output "DETAIL: $($_.ErrorDetails.Message)" }
}

# List all chats as buyer
Write-Output "`n=== Chat list (buyer) ==="
$h = @{ Authorization = "Bearer $bt" }
$r = Invoke-RestMethod -Uri "$base/chats/" -Method Get -Headers $h
$r | ConvertTo-Json -Depth 3