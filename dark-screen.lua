-- Giả sử bạn có một ScreenGui với Button
local button = script.Parent

button.MouseButton1Click:Connect(function()
	print("Chạy code mới!")
	
	-- Ví dụ chạy một hàm mới
	loadstring([[
		print("Hello từ script mới!")
		for i = 1, 5 do
			print("Dòng "..i)
		end
	]])()
end)
