-- Lấy tham chiếu đến 2 nút
local gui = script.Parent
local button1 = gui:WaitForChild("Button1")
local button2 = gui:WaitForChild("Button2")

-- Khi nhấn Button1
button1.MouseButton1Click:Connect(function()
	print("Chạy code của nút 1!")

	-- Ví dụ: di chuyển nhân vật
	local player = game.Players.LocalPlayer
	local character = player.Character or player.CharacterAdded:Wait()
	character:MoveTo(Vector3.new(0, 10, 0))
end)

-- Khi nhấn Button2
button2.MouseButton1Click:Connect(function()
	print("Chạy code của nút 2!")

	-- Ví dụ: đổi màu trời
	game.Lighting.Ambient = Color3.new(1, 0.5, 0.5)
	game.Lighting.Brightness = 3
end)
