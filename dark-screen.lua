-- 📜 LocalScript trong ScreenGui, có 1 nút: "BlackoutButton"
local button = script.Parent:WaitForChild("BlackoutButton")

button.MouseButton1Click:Connect(function()
	local player = game.Players.LocalPlayer
	local coreGui = game:GetService("CoreGui")

	-- 🧱 Tạo GUI blackout
	local screenGui = Instance.new("ScreenGui")
	screenGui.Name = "BlackoutOverlay"
	screenGui.ResetOnSpawn = false
	screenGui.IgnoreGuiInset = true
	screenGui.DisplayOrder = 999999
	screenGui.Parent = coreGui

	local blackoutFrame = Instance.new("Frame")
	blackoutFrame.Size = UDim2.new(1, 0, 1, 0)
	blackoutFrame.Position = UDim2.new(0, 0, 0, 0)
	blackoutFrame.BackgroundColor3 = Color3.new(0, 0, 0)
	blackoutFrame.BackgroundTransparency = 0
	blackoutFrame.ZIndex = 999999
	blackoutFrame.Parent = screenGui

	-- 🟢 Nút "Quay lại màn hình chính"
	local backButton = Instance.new("TextButton")
	backButton.Size = UDim2.new(0, 250, 0, 60)
	backButton.Position = UDim2.new(0.5, -125, 0.5, -30)
	backButton.BackgroundColor3 = Color3.fromRGB(255, 255, 255)
	backButton.TextColor3 = Color3.fromRGB(0, 0, 0)
	backButton.Text = "⬅️ Quay lại màn hình chính"
	backButton.Font = Enum.Font.SourceSansBold
	backButton.TextSize = 22
	backButton.ZIndex = 1000000
	backButton.Parent = blackoutFrame

	-- 🔙 Khi nhấn nút quay lại
	backButton.MouseButton1Click:Connect(function()
		screenGui:Destroy()
	end)
end)
