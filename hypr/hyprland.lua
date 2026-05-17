-- Hyprland v0.55 Lua Configuration
-- Based on your hyprland.conf, ported to Lua using the official API

local home = os.getenv("HOME")
local mainMod = "SUPER"
local terminal = "kitty"
local menu = home .. "/.config/rofi/bin/launcher/launcher.sh"
local scripts = home .. "/.config/hypr/scripts"

------------------
---- MONITORS ----
------------------

hl.monitor({
    output   = "DP-2",
    mode     = "1920x1080@180",
    position = "0x0",
    scale    = 1,
})

-------------------
---- AUTOSTART ----
-------------------

hl.on("hyprland.start", function()
hl.exec_cmd("swaync")
hl.exec_cmd("ags run")
hl.exec_cmd("swaybg -i " .. home .. "/.config/hypr/wallpaper.png")
hl.exec_cmd(scripts .. "/launch-hyprland.sh")
hl.exec_cmd("sleep 2 && WOVEN_ROOT=" .. home .. "/.config/woven " .. home .. "/.local/bin/woven")
end)

-----------------------
---- LOOK AND FEEL ----
-----------------------

hl.config({
    general = {
        gaps_in  = 10,
        gaps_out = 20,
        border_size = 4,
        resize_on_border = true,
        col = {
            active_border   = "rgb(9564fd)",
          inactive_border = "rgb(9564fd)",
        },
        layout = "dwindle",
    },

    decoration = {
        rounding = 10,
        active_opacity = 1.0,
        inactive_opacity = 0.55,
        shadow = {
            enabled = true,
            range = 4,
            render_power = 3,
            color = 0xee1a1a1a,
        },
        blur = {
            enabled = true,
            size = 3,
            passes = 1,
            vibrancy = 0.1696,
        },
    },

    animations = {
        enabled = true,
    },
})

-- Custom animations
hl.curve("easeInExpo", { type = "bezier", points = { {0.16, 1}, {0.3, 1} } })

hl.animation({ leaf = "workspaces", enabled = true, speed = 1, bezier = "easeInExpo", style = "slidefade 20%" })
hl.animation({ leaf = "windows",    enabled = true, speed = 1, bezier = "easeInExpo", style = "slide down" })

-- Dwindle layout settings
hl.config({
    dwindle = {
        preserve_split = true,
    },
})

-- Misc settings
hl.config({
    misc = {
        force_default_wallpaper = 1,
            disable_hyprland_logo = true,
            enable_anr_dialog = false,
    },
})

---------------
---- INPUT ----
---------------

hl.config({
    input = {
        kb_layout = "us,ru",
        kb_options = "grp:ctrl_space_toggle",
        follow_mouse = 1,
        touchpad = {
            natural_scroll = false,
        },
    },
})

---------------------
---- KEYBINDINGS ----
---------------------

-- Fast Access
hl.bind(mainMod .. " + RETURN", hl.dsp.exec_cmd(terminal))
hl.bind(mainMod .. " + Q", hl.dsp.window.close())
hl.bind("SHIFT + " .. mainMod .. " + E", hl.dsp.exit())
hl.bind(mainMod .. " + SHIFT + T", hl.dsp.window.float({ action = "toggle" }))
hl.bind(mainMod .. " + SHIFT + F", hl.dsp.window.fullscreen())
hl.bind(mainMod .. " + D", hl.dsp.exec_cmd(menu))
hl.bind(mainMod .. " + SHIFT + P", hl.dsp.exec_cmd(home .. "/.config/rofi/bin/powermenu/powermenu.sh"))
hl.bind(mainMod .. " + B", hl.dsp.exec_cmd("helium-browser"))
hl.bind(mainMod .. " + E", hl.dsp.exec_cmd("dolphin"))
hl.bind(mainMod .. " + M", hl.dsp.exec_cmd("kitty dgop"))
hl.bind(mainMod .. " + CTRL + P", hl.dsp.exec_cmd("hyprlock"))
hl.bind(mainMod .. " + N", hl.dsp.exec_cmd("swaync-client -t -sw"))
hl.bind(mainMod .. " + Y", hl.dsp.exec_cmd(scripts .. "/wallpaper.sh"))
hl.bind(mainMod .. " + A", hl.dsp.exec_cmd(home .. "/.local/bin/woven-ctrl --toggle"))
hl.bind(mainMod .. " + S", hl.dsp.exec_cmd("/usr/local/bin/scratchpad"))

-- Focus movement (vim keys)
hl.bind(mainMod .. " + H", hl.dsp.focus({ direction = "left" }))
hl.bind(mainMod .. " + J", hl.dsp.focus({ direction = "down" }))
hl.bind(mainMod .. " + K", hl.dsp.focus({ direction = "up" }))
hl.bind(mainMod .. " + L", hl.dsp.focus({ direction = "right" }))
hl.bind(mainMod .. " + LEFT", hl.dsp.focus({ direction = "left" }))
hl.bind(mainMod .. " + DOWN", hl.dsp.focus({ direction = "down" }))
hl.bind(mainMod .. " + UP", hl.dsp.focus({ direction = "up" }))
hl.bind(mainMod .. " + RIGHT", hl.dsp.focus({ direction = "right" }))

-- Toggle split (dwindle only)
hl.bind(mainMod .. " + R", hl.dsp.layout("togglesplit"))

-- Move windows (swap in dwindle)
hl.bind(mainMod .. " + SHIFT + H", hl.dsp.layout("swapleft"))
hl.bind(mainMod .. " + SHIFT + J", hl.dsp.layout("swapdown"))
hl.bind(mainMod .. " + SHIFT + K", hl.dsp.layout("swapup"))
hl.bind(mainMod .. " + SHIFT + L", hl.dsp.layout("swapright"))
hl.bind(mainMod .. " + SHIFT + LEFT", hl.dsp.layout("swapleft"))
hl.bind(mainMod .. " + SHIFT + DOWN", hl.dsp.layout("swapdown"))
hl.bind(mainMod .. " + SHIFT + UP", hl.dsp.layout("swapup"))
hl.bind(mainMod .. " + SHIFT + RIGHT", hl.dsp.layout("swapright"))

hl.bind(mainMod .. " + mouse:272", hl.dsp.window.drag(), { mouse = true })
hl.bind(mainMod .. " + mouse:273", hl.dsp.window.resize(), { mouse = true })

-- Switch workspaces
for i = 1, 10 do
    local key = i % 10
    hl.bind(mainMod .. " + " .. key, hl.dsp.focus({ workspace = i }))
    hl.bind(mainMod .. " + SHIFT + " .. key, hl.dsp.window.move({ workspace = i }))
    end

    -- Workspace relative navigation
    hl.bind(mainMod .. " + U", hl.dsp.focus({ workspace = "e-1" }))
    hl.bind(mainMod .. " + I", hl.dsp.focus({ workspace = "e+1" }))
    hl.bind(mainMod .. " + Page_Down", hl.dsp.focus({ workspace = "e-1" }))
    hl.bind(mainMod .. " + Page_Up", hl.dsp.focus({ workspace = "e+1" }))

    -- Move window to workspace relative
    hl.bind(mainMod .. " + CTRL + U", hl.dsp.window.move({ workspace = "e-1" }))
    hl.bind(mainMod .. " + CTRL + I", hl.dsp.window.move({ workspace = "e+1" }))
    hl.bind(mainMod .. " + CTRL + DOWN", hl.dsp.window.move({ workspace = "e-1" }))
    hl.bind(mainMod .. " + CTRL + UP", hl.dsp.window.move({ workspace = "e+1" }))

    -- Window sizing (dwindle layout messages)
    hl.bind(mainMod .. " + equal", hl.dsp.layout("increasesplit"))
    hl.bind(mainMod .. " + minus", hl.dsp.layout("decresplit"))
    hl.bind(mainMod .. " + SHIFT + equal", hl.dsp.layout("incmastersize 10"))
    hl.bind(mainMod .. " + SHIFT + minus", hl.dsp.layout("incmastersize -10"))
    hl.bind(mainMod .. " + F", hl.dsp.window.fullscreen())
    hl.bind(mainMod .. " + C", hl.dsp.layout("centerwindow"))

    -- Multi-monitor
    hl.bind(mainMod .. " + CTRL + H", hl.dsp.focus({ direction = "left" }))
    hl.bind(mainMod .. " + CTRL + L", hl.dsp.focus({ direction = "right" }))
    hl.bind(mainMod .. " + CTRL + J", hl.dsp.focus({ direction = "down" }))
    hl.bind(mainMod .. " + CTRL + K", hl.dsp.focus({ direction = "up" }))
    hl.bind(mainMod .. " + CTRL + LEFT", hl.dsp.focus({ direction = "left" }))
    hl.bind(mainMod .. " + CTRL + RIGHT", hl.dsp.focus({ direction = "right" }))

    hl.bind(mainMod .. " + SHIFT + CTRL + H", hl.dsp.window.move({ monitor = -1 }))
    hl.bind(mainMod .. " + SHIFT + CTRL + L", hl.dsp.window.move({ monitor = 1 }))
    hl.bind(mainMod .. " + SHIFT + CTRL + J", hl.dsp.window.move({ monitor = 1 }))
    hl.bind(mainMod .. " + SHIFT + CTRL + K", hl.dsp.window.move({ monitor = -1 }))
    hl.bind(mainMod .. " + SHIFT + CTRL + LEFT", hl.dsp.window.move({ monitor = -1 }))
    hl.bind(mainMod .. " + SHIFT + CTRL + RIGHT", hl.dsp.window.move({ monitor = 1 }))

    -- Multimedia keys
    hl.bind("XF86AudioLowerVolume", hl.dsp.exec_cmd(scripts .. "/media volume_down"), { repeating = true })
    hl.bind("XF86AudioRaiseVolume", hl.dsp.exec_cmd(scripts .. "/media volume_up"), { repeating = true })
    hl.bind("XF86AudioMute", hl.dsp.exec_cmd(scripts .. "/media volume_mute"))
    hl.bind("XF86AudioNext", hl.dsp.exec_cmd("playerctl next"), { locked = true })
    hl.bind("XF86AudioPause", hl.dsp.exec_cmd("playerctl play-pause"), { locked = true })
    hl.bind("XF86AudioPlay", hl.dsp.exec_cmd("playerctl play-pause"), { locked = true })
    hl.bind("XF86AudioPrev", hl.dsp.exec_cmd("playerctl previous"), { locked = true })

    -- Brightness keys
    hl.bind("XF86MonBrightnessUp", hl.dsp.exec_cmd("brightnessctl s 10%+"), { repeating = true })
    hl.bind("XF86MonBrightnessDown", hl.dsp.exec_cmd("brightnessctl s 10%-"), { repeating = true })

    -- Screenshots
    hl.bind("CTRL + S", hl.dsp.exec_cmd(scripts .. "/screenshot"))
    hl.bind("SHIFT + Print", hl.dsp.exec_cmd(scripts .. "/selection-screenshot"))
    hl.bind("ALT + Print", hl.dsp.exec_cmd(scripts .. "/window-screenshot"))

    -- Special binds
    hl.bind(mainMod .. " + Tab", hl.dsp.window.cycle_next())
    hl.bind(mainMod .. " + W", hl.dsp.group.toggle())
