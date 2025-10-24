-- 🔴🟢 NÚT NHỎ GỌN, DI CHUYỂN ĐƯỢC, TỰ BẬT MÀN HÌNH ĐEN KHI CHẠY
local Players = game:GetService("Players")
local TweenService = game:GetService("TweenService")
local UserInputService = game:GetService("UserInputService")

local player = Players.LocalPlayer
local playerGui = player:WaitForChild("PlayerGui")

-- GUI chính
local screenGui = Instance.new("ScreenGui")
screenGui.Name = "MiniToggleUI"
screenGui.IgnoreGuiInset = true
screenGui.ResetOnSpawn = false
screenGui.ZIndexBehavior = Enum.ZIndexBehavior.Global
screenGui.Parent = playerGui

-- MÀN HÌNH ĐEN
local blackoutFrame = Instance.new("Frame")
blackoutFrame.Size = UDim2.new(1, 0, 1, 0)
blackoutFrame.BackgroundColor3 = Color3.new(0, 0, 0)
blackoutFrame.BackgroundTransparency = 1
blackoutFrame.Visible = false
blackoutFrame.ZIndex = 999998
blackoutFrame.Parent = screenGui

-- NÚT 🔴🟢 (nhỏ, tròn)
local toggleButton = Instance.new("TextButton")
toggleButton.Size = UDim2.new(0, 50, 0, 50)
toggleButton.Position = UDim2.new(0.05, 0, 0.7, 0)
toggleButton.BackgroundColor3 = Color3.fromRGB(15, 15, 15)
toggleButton.TextColor3 = Color3.fromRGB(255, 255, 255)
toggleButton.Font = Enum.Font.GothamBold
toggleButton.TextSize = 28
toggleButton.Text = "🟢"
toggleButton.AutoButtonColor = false
toggleButton.ZIndex = 999999
toggleButton.Parent = screenGui

-- Bo tròn + viền
local corner = Instance.new("UICorner", toggleButton)
corner.CornerRadius = UDim.new(1, 0)
local stroke = Instance.new("UIStroke", toggleButton)
stroke.Color = Color3.fromRGB(255, 255, 255)
stroke.Thickness = 1.5

-- Hover animation
toggleButton.MouseEnter:Connect(function()
	TweenService:Create(toggleButton, TweenInfo.new(0.2), {BackgroundColor3 = Color3.fromRGB(30, 30, 30)}):Play()
end)
toggleButton.MouseLeave:Connect(function()
	TweenService:Create(toggleButton, TweenInfo.new(0.2), {BackgroundColor3 = Color3.fromRGB(15, 15, 15)}):Play()
end)

-- Kéo di chuyển
local dragging = false
local dragStart, startPos
local function updateDrag(input)
	local delta = input.Position - dragStart
	toggleButton.Position = UDim2.new(
		startPos.X.Scale,
		startPos.X.Offset + delta.X,
		startPos.Y.Scale,
		startPos.Y.Offset + delta.Y
	)
end
toggleButton.InputBegan:Connect(function(input)
	if input.UserInputType == Enum.UserInputType.MouseButton1 or input.UserInputType == Enum.UserInputType.Touch then
		dragging = true
		dragStart = input.Position
		startPos = toggleButton.Position
		input.Changed:Connect(function()
			if input.UserInputState == Enum.UserInputState.End then
				dragging = false
			end
		end)
	end
end)
UserInputService.InputChanged:Connect(function(input)
	if dragging and (input.UserInputType == Enum.UserInputType.MouseMovement or input.UserInputType == Enum.UserInputType.Touch) then
		updateDrag(input)
	end
end)

-- Trạng thái
local isBlackout = false

local function setBlackout(state)
	if state then
		blackoutFrame.Visible = true
		TweenService:Create(blackoutFrame, TweenInfo.new(0.4), {BackgroundTransparency = 0}):Play()
		toggleButton.Text = "🔴"
	else
		local tween = TweenService:Create(blackoutFrame, TweenInfo.new(0.4), {BackgroundTransparency = 1})
		tween:Play()
		tween.Completed:Wait()
		blackoutFrame.Visible = false
		toggleButton.Text = "🟢"
	end
	isBlackout = state
end

-- Bật/tắt khi bấm nút
toggleButton.MouseButton1Click:Connect(function()
	setBlackout(not isBlackout)
end)

-- 🌑 TỰ ĐỘNG BẬT MÀN HÌNH ĐEN KHI SCRIPT CHẠY
setBlackout(true)
