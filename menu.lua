-- GUI Roblox Windows Style với Toggle chạy script
local player = game.Players.LocalPlayer
local TweenService = game:GetService("TweenService")

-- GUI gốc
local gui = Instance.new("ScreenGui", player:WaitForChild("PlayerGui"))
gui.Name = "WindowsUI"
gui.ResetOnSpawn = false

-- ==============================
-- CỬA SỔ CHÍNH
-- ==============================
local window = Instance.new("Frame", gui)
window.Name = "MainWindow"
window.Size = UDim2.new(0,420,0,320)
window.Position = UDim2.new(0.3,0,0.25,0)
window.BackgroundColor3 = Color3.fromRGB(35,35,40)
window.Active = true
window.Draggable = true
Instance.new("UICorner", window).CornerRadius = UDim.new(0,10)
local stroke = Instance.new("UIStroke", window)
stroke.Color = Color3.fromRGB(90,150,255)
stroke.Thickness = 2
stroke.Transparency = 0.4

-- ==============================
-- THANH TIÊU ĐỀ (KHÔNG KÉO ĐƯỢC)
-- ==============================
local titleBar = Instance.new("Frame", window)
titleBar.Size = UDim2.new(1,0,0,35)
titleBar.BackgroundColor3 = Color3.fromRGB(50,50,60)
titleBar.BorderSizePixel = 0

local title = Instance.new("TextLabel", titleBar)
title.BackgroundTransparency = 1
title.Text = "💻 Roblox Window"
title.Font = Enum.Font.GothamBold
title.TextSize = 18
title.TextColor3 = Color3.fromRGB(255,255,255)
title.Position = UDim2.new(0.03,0,0,0)
title.Size = UDim2.new(0.7,0,1,0)

-- ==============================
-- NÚT GÓC PHẢI
-- ==============================
local function makeBtn(symbol,colorNormal,colorHover)
	local btn = Instance.new("TextButton")
	btn.Size = UDim2.new(0,45,1,0)
	btn.BackgroundColor3 = colorNormal
	btn.Font = Enum.Font.GothamBold
	btn.Text = symbol
	btn.TextSize = 18
	btn.TextColor3 = Color3.new(1,1,1)
	btn.BorderSizePixel = 0
	btn.AutoButtonColor = false
	btn.MouseEnter:Connect(function() btn.BackgroundColor3 = colorHover end)
	btn.MouseLeave:Connect(function() btn.BackgroundColor3 = colorNormal end)
	return btn
end

local closeBtn = makeBtn("✖", Color3.fromRGB(45,45,50), Color3.fromRGB(230,70,70))
local maxBtn = makeBtn("[]", Color3.fromRGB(45,45,50), Color3.fromRGB(80,150,255))
local minBtn = makeBtn("-", Color3.fromRGB(45,45,50), Color3.fromRGB(90,200,90))
closeBtn.Parent, maxBtn.Parent, minBtn.Parent = titleBar, titleBar, titleBar
closeBtn.Position = UDim2.new(1,-45,0,0)
maxBtn.Position = UDim2.new(1,-90,0,0)
minBtn.Position = UDim2.new(1,-135,0,0)

-- ==============================
-- NỘI DUNG
-- ==============================
local content = Instance.new("Frame", window)
content.Position = UDim2.new(0,0,0,35)
content.Size = UDim2.new(1,0,1,-35)
content.BackgroundColor3 = Color3.fromRGB(35,35,40)
content.BorderSizePixel = 0

-- ==============================
-- TAB NHỎ
-- ==============================
local miniTab = Instance.new("TextButton", gui)
miniTab.Text = "💻 Roblox Window"
miniTab.Size = UDim2.new(0,180,0,35)
miniTab.Position = UDim2.new(0,20,1,-45)
miniTab.BackgroundColor3 = Color3.fromRGB(55,55,65)
miniTab.TextColor3 = Color3.new(1,1,1)
miniTab.Font = Enum.Font.GothamBold
miniTab.TextSize = 18
Instance.new("UICorner", miniTab).CornerRadius = UDim.new(0,8)
miniTab.Visible = false

-- ==============================
-- CHỨC NĂNG CỬA SỔ
-- ==============================
local minimized, maximized = false, false
local normalSize, normalPos = window.Size, window.Position

-- Thu nhỏ
minBtn.MouseButton1Click:Connect(function()
	if not minimized then
		if maximized then
			window.Size, window.Position = normalSize, normalPos
			maximized = false
		end
		TweenService:Create(window, TweenInfo.new(0.25), {Position=UDim2.new(window.Position.X.Scale, window.Position.X.Offset,1,50)}):Play()
		task.wait(0.25)
		window.Visible, miniTab.Visible, minimized = false,true,true
	end
end)

-- Mở lại từ tab nhỏ
miniTab.MouseButton1Click:Connect(function()
	if minimized then
		window.Visible = true
		TweenService:Create(window, TweenInfo.new(0.3), {Position=normalPos}):Play()
		miniTab.Visible, minimized = false,false
	end
end)

-- Phóng to / phục hồi
maxBtn.MouseButton1Click:Connect(function()
	if maximized then
		TweenService:Create(window, TweenInfo.new(0.3), {Size=normalSize,Position=normalPos}):Play()
		maximized = false
	else
		normalSize, normalPos = window.Size, window.Position
		TweenService:Create(window, TweenInfo.new(0.3), {Size=UDim2.new(1,-60,1,-60),Position=UDim2.new(0,30,0,30)}):Play()
		maximized = true
	end
end)

-- Đóng
closeBtn.MouseButton1Click:Connect(function()
	gui:Destroy()
	print("🛑 Windows-style GUI stopped.")
end)

-- ==============================
-- HÀM TẠO TOGGLE
-- ==============================
local function createToggle(parent,name,url,posY)
	local container = Instance.new("Frame", parent)
	container.Size = UDim2.new(1,-40,0,40)
	container.Position = UDim2.new(0,20,0,posY)
	container.BackgroundTransparency = 1

	local label = Instance.new("TextLabel", container)
	label.Size = UDim2.new(0.7,0,1,0)
	label.Position = UDim2.new(0,0,0,0)
	label.BackgroundTransparency = 1
	label.Text = name
	label.TextColor3 = Color3.fromRGB(220,220,255)
	label.Font = Enum.Font.GothamBold
	label.TextSize = 18
	label.TextXAlignment = Enum.TextXAlignment.Left

	local toggleBtn = Instance.new("TextButton", container)
	toggleBtn.Size = UDim2.new(0,50,0,25)
	toggleBtn.Position = UDim2.new(1,-50,0.5,-12)
	toggleBtn.BackgroundColor3 = Color3.fromRGB(80,80,80)
	toggleBtn.AutoButtonColor = false
	toggleBtn.Text = ""
	Instance.new("UICorner", toggleBtn).CornerRadius = UDim.new(0,12)

	local circle = Instance.new("Frame", toggleBtn)
	circle.Size = UDim2.new(0,21,0,21)
	circle.Position = UDim2.new(0,2,0,2)
	circle.BackgroundColor3 = Color3.fromRGB(255,255,255)
	Instance.new("UICorner", circle).CornerRadius = UDim.new(0,10)

	local toggled = false
	toggleBtn.MouseButton1Click:Connect(function()
		toggled = not toggled
		if toggled then
			TweenService:Create(circle, TweenInfo.new(0.2), {Position=UDim2.new(1,-23,0,2)}):Play()
			toggleBtn.BackgroundColor3 = Color3.fromRGB(0,200,0)
			if url then
				loadstring(game:HttpGet(url,true))()
			end
		else
			TweenService:Create(circle, TweenInfo.new(0.2), {Position=UDim2.new(0,2,0,2)}):Play()
			toggleBtn.BackgroundColor3 = Color3.fromRGB(80,80,80)
		end
	end)
end

-- ==============================
-- TẠO TOGGLE
-- ==============================
createToggle(content,"Speed Hub X","https://raw.githubusercontent.com/AhmadV99/Speed-Hub-X/main/Speed%20Hub%20X.lua",50)
createToggle(content,"Example Script 2","https://example.com/script2.lua",100)
