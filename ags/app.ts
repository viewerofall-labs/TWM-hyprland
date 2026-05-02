#!/usr/bin/env -S ags run --gtk 3

import "gi://Gtk?version=3.0"
import { App, Astal, Gtk, Gdk } from "astal/gtk3"
import * as Widget from "astal/gtk3/widget"
import Variable from "astal/variable"
import { bind } from "astal/binding"
import GLib from "gi://GLib"
import Hyprland from "gi://AstalHyprland"
import Wp from "gi://AstalWp"
import Battery from "gi://AstalBattery"
import Network from "gi://AstalNetwork"
import Tray from "gi://AstalTray"
import Mpris from "gi://AstalMpris"

// ─── The World Machine palette ────────────────────────────────────────────────
const C = {
  void:    "#08000e",   // deepest bg
  deep:    "#120020",   // module bg
  mid:     "#1e0038",   // slightly lighter
  fg:      "#c792ea",   // pale violet
  dim:     "#7B5AAA",   // muted violet
  teal:    "#00e5c8",   // machine accent
  yellow:  "#FFFF33",   // clock highlight
  red:     "#ff4f7b",   // power/danger
  border:  "rgba(199, 146, 234, 0.22)",
  tealBdr: "rgba(0, 229, 200, 0.25)",
}

const controlCenterVisible = Variable(false)

// ─── Workspaces ───────────────────────────────────────────────────────────────
function Workspaces() {
  const hypr = Hyprland.get_default()
  return new Widget.Box({
    className: "workspaces",
    children: bind(hypr, "workspaces").as(wss =>
      wss
        .filter(ws => ws.id > 0)
        .sort((a, b) => a.id - b.id)
        .map(ws => new Widget.Button({
          className: bind(hypr, "focusedWorkspace").as(fw =>
            ws === fw ? "ws ws-focused" : "ws"
          ),
          onClicked: () => ws.focus(),
          child: new Widget.Label({ label: `${ws.id}` }),
        }))
    ),
  })
}

// ─── Client Title ─────────────────────────────────────────────────────────────
function ClientTitle() {
  const hypr = Hyprland.get_default()
  const focused = bind(hypr, "focusedClient")
  return new Widget.Box({
    className: "pill client-title",
    visible: focused.as(Boolean),
    child: new Widget.Label({
      label: focused.as(c => c?.title != null ? c.title.substring(0, 40) : ""),
    }),
  })
}

// ─── Clock ────────────────────────────────────────────────────────────────────
function Clock() {
  const time = Variable("").poll(1000, () =>
    GLib.DateTime.new_now_local().format("%H:%M:%S")!
  )
  const date = Variable("").poll(60000, () =>
    GLib.DateTime.new_now_local().format("%a %d %b")!
  )
  return new Widget.Box({
    className: "pill clock",
    children: [
      new Widget.Label({ className: "clock-bracket", label: "[" }),
      new Widget.Label({ className: "clock-time",    label: time() }),
      new Widget.Label({ className: "clock-sep",     label: "  " }),
      new Widget.Label({ className: "clock-date",    label: date() }),
      new Widget.Label({ className: "clock-bracket", label: "]" }),
    ],
  })
}

// ─── Weather ──────────────────────────────────────────────────────────────────
function Weather() {
  const data = Variable<{ temp: string; icon: string }>({ temp: "--", icon: "~" })

  function condIcon(c: string) {
    if (c.includes("Clear") || c.includes("Sunny"))  return "󰖙"
    if (c.includes("Partly"))                         return "󰖕"
    if (c.includes("Cloudy") || c.includes("Over"))  return "󰖐"
    if (c.includes("Rain")   || c.includes("Driz"))  return "󰖗"
    if (c.includes("Snow"))                           return "󰖘"
    if (c.includes("Thunder") || c.includes("storm"))return "󰖓"
    return "󰖙"
  }

  function fetch() {
    try {
      const cfg = `${GLib.get_home_dir()}/.config/weather-config`
      const [ok, raw] = GLib.file_get_contents(cfg)
      const city  = ok ? new TextDecoder().decode(raw).trim() : "Phoenix"
      const cache = `${GLib.get_home_dir()}/.cache/ags-weather.json`
      GLib.spawn_command_line_async(`bash -c "curl -sf 'wttr.in/${city}?format=j1' -o ${cache}"`)
      GLib.timeout_add(GLib.PRIORITY_DEFAULT, 3000, () => {
        try {
          const [, buf] = GLib.file_get_contents(cache)
          const p = JSON.parse(new TextDecoder().decode(buf))
          const temp = p.current_condition[0].temp_F
          const cond = p.current_condition[0].weatherDesc[0].value
          data.set({ temp, icon: condIcon(cond) })
        } catch {}
        return false
      })
    } catch {}
  }

  fetch()
  Variable("").poll(1800000, fetch)

  return new Widget.Box({
    className: "pill weather",
    child: new Widget.Label({
      className: "weather-label",
      label: data().as(d => `${d.icon}  ${d.temp}°F`),
    }),
  })
}

// ─── Temperatures ─────────────────────────────────────────────────────────────
function Temps() {
  const cpuTemp = Variable(0).poll(3000, () => {
    try {
      const [, b] = GLib.file_get_contents("/sys/class/thermal/thermal_zone0/temp")
      return Math.round(parseInt(new TextDecoder().decode(b).trim()) / 1000)
    } catch { return 0 }
  })

  // AMD 6700 XT junction (hotspot) — hwmon2/temp2
  const gpuTemp = Variable(0).poll(3000, () => {
    try {
      const [, b] = GLib.file_get_contents("/sys/class/hwmon/hwmon2/temp2_input")
      return Math.round(parseInt(new TextDecoder().decode(b).trim()) / 1000)
    } catch { return 0 }
  })

  return new Widget.Box({
    className: "pill temps",
    children: [
      new Widget.Label({ className: "temp-icon", label: "󰻠" }),
      new Widget.Label({
        className: "temp-val",
        label: cpuTemp().as(t => `${t}°`),
        tooltipText: cpuTemp().as(t => `CPU: ${t}°C`),
      }),
      new Widget.Label({ className: "temp-div", label: "  " }),
      new Widget.Label({ className: "temp-icon gpu", label: "󰍛" }),
      new Widget.Label({
        className: "temp-val gpu",
        label: gpuTemp().as(t => `${t}°`),
        tooltipText: gpuTemp().as(t => `GPU junction: ${t}°C`),
      }),
    ],
  })
}

// ─── Media ────────────────────────────────────────────────────────────────────
function Media() {
  const mpris = Mpris.get_default()
  return new Widget.Box({
    className: "pill media",
    visible: bind(mpris, "players").as(p => p.length > 0),
    children: bind(mpris, "players").as(players => {
      const player = players[0]
      if (!player) return []
      return [
        new Widget.Button({
          className: "media-btn",
          onClicked: () => player.previous(),
          child: new Widget.Label({ label: "󰒮" }),
        }),
        new Widget.Button({
          className: "media-btn media-play",
          onClicked: () => player.playPause(),
          child: new Widget.Label({
            label: bind(player, "playbackStatus").as(s =>
              s === Mpris.PlaybackStatus.PLAYING ? "󰏤" : "󰐊"
            ),
          }),
        }),
        new Widget.Button({
          className: "media-btn",
          onClicked: () => player.next(),
          child: new Widget.Label({ label: "󰒭" }),
        }),
        new Widget.Label({
          className: "media-title",
          label: bind(player, "title").as(t => t ? t.substring(0, 26) : ""),
        }),
      ]
    }),
  })
}

// ─── SysTray ──────────────────────────────────────────────────────────────────
function SysTray() {
  const tray = Tray.get_default()
  return new Widget.Box({
    className: "pill systray",
    visible: bind(tray, "items").as(i => i.length > 0),
    children: bind(tray, "items").as(items =>
      items.map(item => {
        if (item.iconThemePath)
          Gtk.IconTheme.get_default()?.append_search_path(item.iconThemePath)
        return new Widget.Button({
          className: "tray-btn",
          tooltipMarkup: bind(item, "tooltipMarkup"),
          onClickRelease: (_, ev) => item.activate(ev.x, ev.y),
          child: new Widget.Icon({ gicon: bind(item, "gicon") }),
        })
      })
    ),
  })
}

// ─── App Launcher ─────────────────────────────────────────────────────────────
function AppLauncher() {
  return new Widget.Button({
    className: "pill launcher-btn",
    tooltipText: "Applications",
    onClicked: () => GLib.spawn_command_line_async(
      `${GLib.get_home_dir()}/.config/rofi/bin/launcher/launcher.sh`
    ),
    child: new Widget.Label({ label: "󰐱" }),  // 9-dot grid
  })
}

// ─── Wallpaper ────────────────────────────────────────────────────────────────
function WallpaperBtn() {
  return new Widget.Button({
    className: "pill icon-btn wallpaper-btn",
    tooltipText: "Wallpaper",
    onClicked: () => GLib.spawn_command_line_async(
      `${GLib.get_home_dir()}/.config/hypr/scripts/wallpaper.sh`
    ),
    child: new Widget.Label({ label: "󰸉" }),
  })
}

// ─── Notification Button ──────────────────────────────────────────────────────
function NotifBtn() {
  return new Widget.Button({
    className: "pill icon-btn",
    tooltipText: "Notifications",
    onClicked: () => GLib.spawn_command_line_async("swaync-client -t"),
    child: new Widget.Icon({ icon: "preferences-system-notifications-symbolic" }),
  })
}

// ─── Control Center Button ────────────────────────────────────────────────────
function CCBtn() {
  return new Widget.Button({
    className: "pill icon-btn cc-btn",
    tooltipText: "Quick Settings",
    onClicked: () => controlCenterVisible.set(!controlCenterVisible.get()),
    child: new Widget.Icon({ icon: "preferences-system-symbolic" }),
  })
}

// ─── Power ────────────────────────────────────────────────────────────────────
function PowerBtn() {
  return new Widget.Button({
    className: "pill power-btn",
    tooltipText: "Power",
    onClicked: () => GLib.spawn_command_line_async(
      `${GLib.get_home_dir()}/.config/rofi/bin/powermenu/powermenu.sh`
    ),
    child: new Widget.Label({ label: "⏻" }),
  })
}

// ─── Control Center ───────────────────────────────────────────────────────────
function ControlCenter() {
  const wifi    = Network.get_default().wifi
  const speaker = Wp.get_default()?.audio.defaultSpeaker!
  const wifiExpanded = Variable(false)
  const inhibited    = Variable(false)

  const brightness = Variable(50).poll(2000, () => {
    try {
      const [, cur] = GLib.spawn_command_line_sync("brightnessctl get")
      const [, max] = GLib.spawn_command_line_sync("brightnessctl max")
      const c = parseInt(new TextDecoder().decode(cur).trim())
      const m = parseInt(new TextDecoder().decode(max).trim())
      return m > 0 ? Math.round((c / m) * 100) : 50
    } catch { return 50 }
  })

  return new Widget.Window({
    name: "control-center",
    className: "cc-window",
    visible: controlCenterVisible(),
    anchor: Astal.WindowAnchor.TOP | Astal.WindowAnchor.RIGHT,
    exclusivity: Astal.Exclusivity.NORMAL,
    keymode: Astal.Keymode.ON_DEMAND,
    child: new Widget.Box({
      className: "cc-box",
      vertical: true,
      halign: Gtk.Align.CENTER,
      children: [

        // header
        new Widget.Box({
          className: "cc-header",
          children: [
            new Widget.Label({ className: "cc-title", label: "󰒓  SYSTEM CONTROL" }),
          ],
        }),

        // wifi
        new Widget.Box({
          className: "cc-section",
          vertical: true,
          children: [
            new Widget.Box({
              className: "cc-row",
              children: [
                new Widget.Button({
                  className: "cc-toggle",
                  hexpand: true,
                  onClicked: () => { wifi.enabled = !wifi.enabled },
                  child: new Widget.Box({
                    children: [
                      new Widget.Icon({ icon: bind(wifi, "iconName"), className: "cc-icon" }),
                      new Widget.Box({
                        vertical: true,
                        children: [
                          new Widget.Label({ className: "cc-label",    label: "NETWORK",  halign: Gtk.Align.START }),
                          new Widget.Label({ className: "cc-sublabel", halign: Gtk.Align.START,
                            label: bind(wifi, "ssid").as(s => s || "OFFLINE"),
                          }),
                        ],
                      }),
                    ],
                  }),
                }),
                new Widget.Button({
                  className: "cc-expand",
                  onClicked: () => wifiExpanded.set(!wifiExpanded.get()),
                  child: new Widget.Label({
                    label: wifiExpanded().as(e => e ? "▲" : "▼"),
                  }),
                }),
              ],
            }),
            new Widget.Box({
              className: "ap-list",
              vertical: true,
              visible: wifiExpanded(),
              children: bind(wifi, "accessPoints").as(aps =>
                [...aps]
                  .sort((a, b) => b.strength - a.strength)
                  .slice(0, 7)
                  .map(ap => new Widget.Button({
                    className: bind(wifi, "ssid").as(s =>
                      s === ap.ssid ? "ap-row ap-active" : "ap-row"
                    ),
                    onClicked: () =>
                      GLib.spawn_command_line_async(`nmcli device wifi connect "${ap.ssid}"`),
                    child: new Widget.Box({
                      children: [
                        new Widget.Label({
                          className: "ap-sig",
                          label: ap.strength > 66 ? "▌▌▌" : ap.strength > 33 ? "▌▌░" : "▌░░",
                        }),
                        new Widget.Label({
                          className: "ap-ssid", hexpand: true, halign: Gtk.Align.START,
                          label: ap.ssid || "(hidden)",
                        }),
                        new Widget.Label({
                          className: "ap-pct",
                          label: `${ap.strength}%`,
                        }),
                      ],
                    }),
                  }))
              ),
            }),
          ],
        }),

        // bluetooth
        new Widget.Box({
          className: "cc-section",
          children: [
            new Widget.Button({
              className: "cc-toggle",
              hexpand: true,
              onClicked: () => GLib.spawn_command_line_async("bluetoothctl power toggle"),
              child: new Widget.Box({
                children: [
                  new Widget.Icon({ icon: "bluetooth-symbolic", className: "cc-icon" }),
                  new Widget.Label({ className: "cc-label", label: "BLUETOOTH" }),
                ],
              }),
            }),
          ],
        }),

        // volume
        new Widget.Box({
          className: "cc-section",
          vertical: true,
          children: [
            new Widget.Label({ className: "cc-slider-label", label: "VOLUME", halign: Gtk.Align.START }),
            new Widget.Box({
              children: [
                new Widget.Icon({ icon: bind(speaker, "volumeIcon"), className: "cc-icon" }),
                new Widget.Slider({
                  className: "cc-slider",
                  hexpand: true,
                  value: bind(speaker, "volume"),
                  min: 0, max: 1,
                  onDragged: ({ value }) => { speaker.volume = value },
                }),
                new Widget.Label({
                  className: "cc-pct",
                  label: bind(speaker, "volume").as(v => `${Math.round(v * 100)}%`),
                }),
              ],
            }),
          ],
        }),

        // brightness
        new Widget.Box({
          className: "cc-section",
          vertical: true,
          children: [
            new Widget.Label({ className: "cc-slider-label", label: "BRIGHTNESS", halign: Gtk.Align.START }),
            new Widget.Box({
              children: [
                new Widget.Icon({ icon: "display-brightness-symbolic", className: "cc-icon" }),
                new Widget.Slider({
                  className: "cc-slider",
                  hexpand: true,
                  value: brightness().as(b => b / 100),
                  min: 0, max: 1,
                  onDragged: ({ value }) => {
                    const pct = Math.round(value * 100)
                    brightness.set(pct)
                    GLib.spawn_command_line_async(`brightnessctl set ${pct}%`)
                  },
                }),
                new Widget.Label({
                  className: "cc-pct",
                  label: brightness().as(b => `${b}%`),
                }),
              ],
            }),
          ],
        }),

        // actions
        new Widget.Box({
          className: "cc-actions",
          halign: Gtk.Align.CENTER,
          children: [
            new Widget.Button({
              className: "cc-action",
              tooltipText: "Wallpaper",
              onClicked: () => GLib.spawn_command_line_async(
                `${GLib.get_home_dir()}/.config/hypr/scripts/wallpaper.sh`
              ),
              child: new Widget.Label({ label: "󰸉" }),
            }),
            new Widget.Button({
              className: "cc-action",
              tooltipText: inhibited().as(i => i ? "Allow sleep" : "Block sleep"),
              onClicked: () => {
                if (inhibited.get()) {
                  GLib.spawn_command_line_async("pkill -f 'systemd-inhibit --what=idle'")
                  inhibited.set(false)
                } else {
                  GLib.spawn_command_line_async(
                    "systemd-inhibit --what=idle --who=AGS --why=user sleep infinity"
                  )
                  inhibited.set(true)
                }
              },
              child: new Widget.Label({ label: inhibited().as(i => i ? "󰒲" : "󰒳") }),
            }),
          ],
        }),

      ],
    }),
  })
}

// ─── Bar ──────────────────────────────────────────────────────────────────────
function Bar(gdkmonitor: Gdk.Monitor) {
  const { TOP, LEFT, RIGHT } = Astal.WindowAnchor
  return new Widget.Window({
    className: "Bar",
    gdkmonitor,
    exclusivity: Astal.Exclusivity.EXCLUSIVE,
    anchor: TOP | LEFT | RIGHT,
    child: new Widget.CenterBox({
      startWidget: new Widget.Box({
        className: "bar-left",
        halign: Gtk.Align.START,
        children: [AppLauncher(), Workspaces(), ClientTitle()],
      }),
      centerWidget: new Widget.Box({
        className: "bar-center",
        halign: Gtk.Align.CENTER,
        children: [Weather(), Clock()],
      }),
      endWidget: new Widget.Box({
        className: "bar-right",
        halign: Gtk.Align.END,
        children: [SysTray(), Media(), Temps(), WallpaperBtn(), NotifBtn(), CCBtn(), PowerBtn()],
      }),
    }),
  })
}

// ─── CSS ──────────────────────────────────────────────────────────────────────
const css = `
* {
  all: unset;
  font-family: "Inconsolata Nerd Font", "Inconsolata", monospace;
  font-size: 12px;
}

/* ── Bar window ─────────────────────────────── */
window.Bar {
  background-color: ${C.void};
  color: ${C.fg};
  border-bottom: 1px solid ${C.tealBdr};
}

window.Bar > centerbox {
  padding: 4px 8px;
}

/* ── Pill base ──────────────────────────────── */
.pill {
  background-color: ${C.deep};
  border-radius: 10px;
  border: 1px solid ${C.border};
  padding: 2px 10px;
  margin: 1px 3px;
}

/* ── Workspaces ─────────────────────────────── */
box.workspaces {
  background-color: ${C.deep};
  border-radius: 10px;
  border: 1px solid ${C.border};
  padding: 2px 5px;
  margin: 1px 3px;
}

button.ws {
  min-width: 20px;
  min-height: 20px;
  color: ${C.dim};
  padding: 1px 6px;
  border-radius: 7px;
  border: 1px solid transparent;
  font-size: 11px;
  font-weight: 600;
  transition: all 150ms ease;
}

button.ws:hover {
  background-color: rgba(199, 146, 234, 0.18);
  color: ${C.fg};
  border-color: ${C.dim};
}

button.ws.ws-focused {
  background-color: ${C.teal};
  color: ${C.void};
  border-color: ${C.teal};
  font-weight: bold;
}

/* ── Client title ───────────────────────────── */
box.client-title label {
  color: ${C.dim};
  font-size: 11px;
  letter-spacing: 0.5px;
}

/* ── App launcher ───────────────────────────── */
button.launcher-btn {
  border-color: rgba(199, 146, 234, 0.4);
}

button.launcher-btn:hover {
  background-color: rgba(199, 146, 234, 0.15);
  border-color: ${C.fg};
}

button.launcher-btn label {
  color: ${C.fg};
  font-size: 15px;
}

/* ── Clock ──────────────────────────────────── */
box.clock {
  border-color: ${C.tealBdr};
  padding: 2px 10px;
}

label.clock-bracket {
  color: ${C.teal};
  font-size: 13px;
  font-weight: bold;
}

label.clock-time {
  color: ${C.yellow};
  font-size: 13px;
  font-weight: bold;
  letter-spacing: 1px;
}

label.clock-sep {
  color: transparent;
}

label.clock-date {
  color: ${C.dim};
  font-size: 11px;
  letter-spacing: 0.5px;
}

/* ── Weather ────────────────────────────────── */
box.weather {
  border-color: ${C.tealBdr};
}

label.weather-label {
  color: ${C.teal};
  font-size: 12px;
  font-weight: 600;
}

/* ── Temps ──────────────────────────────────── */
box.temps {
  border-color: rgba(199, 146, 234, 0.18);
}

label.temp-icon {
  color: ${C.fg};
  font-size: 12px;
  margin-right: 3px;
}

label.temp-icon.gpu {
  color: ${C.teal};
}

label.temp-val {
  color: ${C.fg};
  font-size: 11px;
  font-weight: 600;
  font-family: monospace;
}

label.temp-val.gpu {
  color: ${C.teal};
}

label.temp-div {
  color: ${C.border};
  font-size: 11px;
}

/* ── Media ──────────────────────────────────── */
box.media {
  border-color: rgba(199, 146, 234, 0.18);
}

button.media-btn {
  padding: 1px 5px;
  border-radius: 5px;
  border: 1px solid transparent;
  transition: all 130ms ease;
}

button.media-btn:hover {
  background-color: rgba(0, 229, 200, 0.12);
  border-color: rgba(0, 229, 200, 0.3);
}

button.media-btn label {
  color: ${C.teal};
  font-size: 12px;
}

button.media-play label {
  color: ${C.fg};
}

label.media-title {
  color: ${C.dim};
  font-size: 11px;
  margin-left: 6px;
  letter-spacing: 0.3px;
}

/* ── Systray ────────────────────────────────── */
box.systray {
  border-color: rgba(199, 146, 234, 0.18);
  padding: 2px 6px;
}

button.tray-btn {
  padding: 2px 4px;
  border-radius: 6px;
  border: 1px solid transparent;
  transition: all 130ms ease;
}

button.tray-btn:hover {
  background-color: rgba(199, 146, 234, 0.15);
  border-color: ${C.dim};
}

/* ── Icon buttons ───────────────────────────── */
button.icon-btn {
  border-color: rgba(199, 146, 234, 0.2);
  transition: all 140ms ease;
}

button.icon-btn:hover {
  background-color: rgba(199, 146, 234, 0.15);
  border-color: ${C.fg};
}

button.icon-btn label,
button.icon-btn icon {
  color: ${C.fg};
  font-size: 14px;
}

button.wallpaper-btn label {
  color: ${C.dim};
  font-size: 13px;
}

button.wallpaper-btn:hover label {
  color: ${C.teal};
}

button.cc-btn icon {
  color: ${C.fg};
  font-size: 14px;
}

/* ── Power ──────────────────────────────────── */
button.power-btn {
  background-color: ${C.deep};
  border-radius: 10px;
  border: 1px solid rgba(255, 79, 123, 0.35);
  padding: 2px 12px;
  margin: 1px 3px;
  transition: all 140ms ease;
}

button.power-btn:hover {
  background-color: rgba(255, 79, 123, 0.18);
  border-color: ${C.red};
}

button.power-btn label {
  color: ${C.red};
  font-size: 18px;
}

/* ── Control Center window ──────────────────── */
window.cc-window {
  background-color: transparent;
}

box.cc-box {
  background-color: rgba(8, 0, 14, 0.97);
  border: 1px solid rgba(199, 146, 234, 0.3);
  border-top: 2px solid ${C.teal};
  border-radius: 0 0 14px 14px;
  padding: 12px;
  margin-top: -1px;
  min-width: 300px;
}

box.cc-header {
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(0, 229, 200, 0.2);
}

label.cc-title {
  color: ${C.teal};
  font-size: 11px;
  font-weight: bold;
  letter-spacing: 2px;
}

box.cc-section {
  background-color: rgba(30, 0, 56, 0.6);
  border-radius: 10px;
  padding: 8px;
  margin-bottom: 5px;
  border: 1px solid rgba(199, 146, 234, 0.1);
}

button.cc-toggle {
  border-radius: 7px;
  padding: 4px 8px;
  border: 1px solid transparent;
  transition: all 130ms ease;
}

button.cc-toggle:hover {
  background-color: rgba(199, 146, 234, 0.12);
  border-color: ${C.dim};
}

button.cc-expand {
  border-radius: 7px;
  padding: 3px 8px;
  border: 1px solid rgba(199, 146, 234, 0.2);
  margin-left: 4px;
  transition: all 130ms ease;
}

button.cc-expand:hover {
  background-color: rgba(199, 146, 234, 0.12);
}

button.cc-expand label {
  color: ${C.dim};
  font-size: 9px;
}

label.cc-label {
  color: ${C.fg};
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 1px;
  margin-left: 8px;
}

label.cc-sublabel {
  color: ${C.dim};
  font-size: 10px;
  letter-spacing: 0.5px;
  margin-left: 8px;
}

.cc-icon {
  color: ${C.teal};
  font-size: 15px;
}

/* AP list */
box.ap-list {
  margin-top: 4px;
  border-top: 1px solid rgba(0, 229, 200, 0.1);
  padding-top: 4px;
}

button.ap-row {
  border-radius: 7px;
  padding: 3px 6px;
  border: 1px solid transparent;
  transition: all 130ms ease;
}

button.ap-row:hover {
  background-color: rgba(199, 146, 234, 0.1);
}

button.ap-row.ap-active {
  background-color: rgba(0, 229, 200, 0.08);
  border-color: rgba(0, 229, 200, 0.3);
}

label.ap-sig {
  color: ${C.teal};
  font-size: 10px;
  margin-right: 6px;
  font-family: monospace;
}

label.ap-ssid {
  color: ${C.fg};
  font-size: 11px;
  letter-spacing: 0.3px;
}

button.ap-row.ap-active label.ap-ssid {
  color: ${C.teal};
  font-weight: 600;
}

label.ap-pct {
  color: ${C.dim};
  font-size: 10px;
  margin-left: 8px;
}

/* Sliders */
label.cc-slider-label {
  color: ${C.fg};
  font-size: 10px;
  font-weight: bold;
  letter-spacing: 1.5px;
  margin-bottom: 4px;
}

slider.cc-slider {
  min-height: 5px;
  background-color: rgba(199, 146, 234, 0.18);
  border-radius: 3px;
}

slider.cc-slider slider {
  background-color: ${C.fg};
  border-radius: 50%;
  min-width: 13px;
  min-height: 13px;
}

slider.cc-slider:hover {
  background-color: rgba(199, 146, 234, 0.28);
}

label.cc-pct {
  color: ${C.dim};
  font-size: 10px;
  min-width: 32px;
  margin-left: 6px;
}

/* Actions */
box.cc-actions {
  margin-top: 4px;
}

button.cc-action {
  background-color: rgba(30, 0, 56, 0.7);
  border: 1px solid rgba(199, 146, 234, 0.2);
  border-radius: 10px;
  padding: 5px 16px;
  margin: 0 3px;
  transition: all 130ms ease;
}

button.cc-action:hover {
  background-color: rgba(0, 229, 200, 0.12);
  border-color: ${C.teal};
}

button.cc-action label {
  color: ${C.fg};
  font-size: 15px;
}

/* Tooltip */
tooltip {
  background-color: rgba(8, 0, 14, 0.98);
  color: ${C.fg};
  border: 1px solid rgba(0, 229, 200, 0.35);
  border-radius: 6px;
  padding: 4px 10px;
  font-size: 11px;
  letter-spacing: 0.5px;
}
`

App.start({
  css,
  main() {
    App.get_monitors().map(Bar)
    ControlCenter()
  },
})
