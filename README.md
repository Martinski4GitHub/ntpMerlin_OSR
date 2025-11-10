# ntpMerlin

## v3.4.11
### Updated on 2025-Nov-08

## About
ntpMerlin implements an NTP time server for AsusWRT Merlin with charts for daily, weekly and monthly summaries of performance. A choice between ntpd and chrony is available.

ntpMerlin is free to use under the [GNU General Public License version 3](https://opensource.org/licenses/GPL-3.0) (GPL 3.0).

## Supported firmware versions
You must be running firmware Merlin 384.15/384.13_4 or Fork 43E5 (or later) [Asuswrt-Merlin](https://asuswrt.lostrealm.ca/)

## Installation
Using your preferred SSH client/terminal, copy and paste the following command, then press Enter:

```sh
/usr/sbin/curl --retry 3 "https://raw.githubusercontent.com/AMTM-OSR/ntpMerlin/master/ntpmerlin.sh" -o "/jffs/scripts/ntpmerlin" && chmod 0755 /jffs/scripts/ntpmerlin && /jffs/scripts/ntpmerlin install
```

## Prerequisites
Asuswrt-Merlin running on a supported ASUS router
Entware installed, preferably using amtm
jffs scripts enabled in the firmware; installing Entware should have taken care of this part

## Usage
### WebUI
ntpMerlin can be configured via the WebUI, in the Addons section.

### Command Line
To launch the ntpMerlin menu after installation, use:
```sh
ntpmerlin
```

If this does not work, you will need to use the full path:
```sh
/jffs/scripts/ntpmerlin
```

## Screenshots

![WebUI](https://puu.sh/HF2uc/396909c6c7.png)

![CLI UI](https://puu.sh/HF2u3/02f06c84a4.png)

## Help
Please post about any issues and problems here: [Asuswrt-Merlin AddOns on SNBForums](https://www.snbforums.com/forums/asuswrt-merlin-addons.60/?prefix_id=22)
