#!/usr/bin/env bash

# Power Menu Script for Oneshot World Machine Rice
# Requires: rofi, systemd

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Theme location
THEME="$HOME/.config/rofi/powermenu.rasi"

# Options with Nerd Font icons
shutdown="󰐥"
reboot="󰜉"
suspend="󰒲 "
lock="󰌾 "
logout="󰍃 "

# Rofi command
rofi_cmd() {
    rofi -dmenu \
        -p "Power Menu" \
        -theme "$THEME" \
        -theme-str 'message { content: "󰚄  System Power Options"; }'
}

# Execute commands
run_cmd() {
    case "$1" in
        "$shutdown")
            systemctl poweroff
            ;;
        "$reboot")
            systemctl reboot
            ;;
        "$suspend")
            systemctl suspend
            ;;
        "$lock")
            # Try hyprlock first, fallback to swaylock
            if command -v hyprlock &> /dev/null; then
                hyprlock
            elif command -v swaylock &> /dev/null; then
                swaylock
            else
                notify-send -u critical "Lock Error" "No lock screen found (hyprlock/swaylock)"
            fi
            ;;
        "$logout")
         hyprctl dispatch "hl.dsp.exit()"
         ;;
    esac
}

# Show menu and get selection
chosen="$(echo -e "$shutdown\n$reboot\n$suspend\n$lock\n$logout" | rofi_cmd)"

# Run the selected option
if [ -n "$chosen" ]; then
    run_cmd "$chosen"
fi
