# Oneshot World Machine 🌙💜

## **This repo is archived, please adapt if you want to use** 

A beautiful purple-themed Hyprland rice inspired by OneShot, featuring a custom AGS (Astal) bar with modern widgets and smooth animations.

### 🎨 Visual Design
- **Purple & Black Theme** - Inspired by OneShot's World Machine
- **Gradient Effects** - Smooth gradients throughout the UI
- **Glow Effects** - Purple glowing borders and shadows
- **Smooth Animations** - 250ms cubic-bezier transitions
- **Modern Rounded Corners** - 8-12px rounded elements

### 📊 AGS Bar Components

**Left Side:**
- 🚀 App Launcher (glowing purple button)
- 🔢 Workspace Indicators (Hyprland)
- 📝 Active Window Title
- Being pretty shitty

**Center:**
- 🕐 Clock (12-hour format with date)

**Right Side:**
- 🖼️ Wallpaper Switcher
- ☀️ Weather Widget
- 🎵 Media Player (expandable controls)
- 💻 CPU Monitor
- 🧠 RAM Monitor
- 🌡️ Temperature Monitor
- 🎮 GPU Monitor (NVIDIA)
- ⚙️ Control Center (WiFi/Bluetooth/Volume/Brightness)
- 🔔 Notification Center
- ☕ Idle Inhibitor
- 😌 Niko Avatar (time-based mood)
- 🔴 Power Menu

### 🎛️ Control Center
DMS-style popup with:
- 📡 WiFi Toggle & Network Info
- 📶 Bluetooth Toggle
- 🔊 Volume Slider
- ☀️ Brightness Slider

### 🎬 Scripts
- Wallpaper selector with rofi
- Media player controls
- Weather widget (wttr.in)
- Power menu (shutdown/reboot/logout)
- Idle inhibitor toggle

## 📋 Requirements

### System
- Arch Linux (or Arch-based)
- Hyprland
- AUR helper (yay or paru)

### Dependencies
**Pacman:**
- hyprland
- waybar
- rofi
- swaync
- playerctl
- curl
- jq
- brightnessctl
- bluez
- bluez-utils
- networkmanager
- thunar

**AUR:**
- libastal-git
- libastal-gjs-git
- libastal-meta
- swww

## 🚀 Installation

### Quick Install

```bash
git clone https://github.com/viewerofall/the-world-machine
cd oneshot-world-machine
chmod +x install.sh
./install.sh
```

### Manual Install

1. **Install dependencies:**
```bash
sudo pacman -S hyprland waybar rofi swaync playerctl curl jq brightnessctl bluez bluez-utils networkmanager
yay -S libastal-git libastal-gjs-git libastal-meta swww
```

2. **Copy configs:**
```bash
cp -r hypr ~/.config/
cp -r ags ~/.config/
cp -r rofi ~/.config/
cp -r swaync ~/.config/
```

3. **Make scripts executable:**
```bash
chmod +x ~/.config/hypr/scripts/*.sh
chmod +x ~/.config/ags/app.ts
chmod +x ~/.config/rofi/bin/powermenu/powermenu.sh
```

4. **Set your city for weather:**
```bash
echo "YourCity" > ~/.config/weather-config
```

5. **Log out and select Hyprland**

## ⌨️ Keybinds

| Key | Action |
|-----|--------|
| `Super + Enter` | Terminal (kitty) |
| `Super + Q` | Close window |
| `Super + M` | Media controls |
| `Super + W` | Weather widget |
| `Super + Space` | App launcher |
| `Super + P` | Power menu |
| `Super + Y` | Wallpaper selector |
| `Super + N` | Notifications |
| `Super + 1-9` | Switch workspace |
| `Super + Shift + 1-9` | Move window to workspace |

## 🎨 Customization

### Change Colors

Edit `~/.config/ags/app.ts`:

```typescript
const colors = {
  bg: "#000000",        // Background
  bgAlt: "#0a0a0a",     // Slightly lighter
  fg: "#9564FD",        // Purple text
  fgAlt: "#7B4FD9",     // Dimmer purple
  accent: "#FFFF33",    // Yellow accent
  border: "#9564FD"     // Border color
}
```

### Add/Remove Widgets

Edit the bar layout in `~/.config/ags/app.ts`:

```typescript
endWidget: new Widget.Box({
  children: [
    WallpaperSwitcher(),
    Weather(),
    // Media(),  // Comment out to hide
    CPU(),
    // ...
  ]
})
```

### Change Weather Location

```bash
echo "London" > ~/.config/weather-config
```

Supports formats: `City`, `City,Country`, `City,State,Country`

### Customize Keybinds

Edit `~/.config/hypr/hyprland.conf`:

```conf
bind = $mainMod, SPACE, exec, ~/.config/rofi/bin/launcher.sh
bind = $mainMod, P, exec, ~/.config/rofi/bin/powermenu/powermenu.sh
```

## 🐛 Troubleshooting

### AGS Bar Not Showing

```bash
# Check if AGS is running
pgrep -fa ags

# Kill and restart
killall ags
ags

# Check for errors
journalctl -f | grep ags
```

### Weather Not Updating

```bash
# Check weather config
cat ~/.config/weather-config

# Test weather fetch
curl "wttr.in/YourCity?format=j1"

# Clear cache
rm ~/.cache/weather-cache.json
```

### Control Center Not Opening

Make sure `brightnessctl` is installed:
```bash
sudo pacman -S brightnessctl
```

### GPU Monitor Not Showing

Only works with NVIDIA GPUs. Install:
```bash
sudo pacman -S nvidia-utils
```

## 📁 File Structure

```
~/.config/
├── hypr/
│   ├── hyprland.conf          # Main Hyprland config
│   ├── animations.conf        # Animation settings
│   └── scripts/
│       ├── wallpaper.sh       # Wallpaper selector
│       └── weather-widget.sh  # Weather popup
├── ags/
│   ├── app.ts                 # Main AGS config
│   └── tsconfig.json          # TypeScript config
├── rofi/
│   └── bin/
│       └── powermenu/
│           └── powermenu.sh   # Power menu
└── swaync/
    └── config.json            # Notification config
```

## 🎯 Performance

- **RAM Usage:** ~50-80 MB (AGS + Hyprland)
- **CPU Usage:** <1% idle
- **Startup Time:** <2 seconds

## 💜 Contributing

Pull requests welcome! Feel free to:
- Add new widgets
- Improve animations
- Fix bugs
- Add themes
- Make better AGS (I will probably merge yours since my ags sucks)

  ## Kitty notes
The kitty config is just if you want to install it because the default theme is quite nice for kitty, this is optional like always but I would recommend it.
---

I fucking hate customizing ags I spent 6 hours on it just to get it to work
