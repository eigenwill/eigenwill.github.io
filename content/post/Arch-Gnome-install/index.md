---
title: "Arch Linux 安装与 Gnome 桌面环境配置"
description: 使用archintall自动安装脚本快速安装，并配置Gnome桌面、插件以及常用功能
date: 2024-04-08 21:59:09+08:00
---

这是一个前一段时间将工位笔记本装入Arch Linux系统的记录。

这台笔记本已经用了6年了，在Windows下卡卡的。下定决心将它刷成Linux后，最初是用的Ubuntu，但是后来发现在安装一些程序的时候总是会出现依赖包版本不够新的问题。

再后来就听说了Arch邪教。。。实际体验下来Arch只有一开始安装麻烦了点，安装好之后就很省心，不需要什么额外操作，记得定时更新就好了。也可能是因为我不需要装Nvidia显卡驱动吧（笑

## archinstall

使用iwctl连接wifi

```bash
iwctl
```

使用archinstall进行脚本安装

| 选项 | 内容 |
| --- | --- |
| Mirror | China |
| Disk configuration | ext4, no for /home |
| Bootloader | Grub |
| Profile | Desktop/Gnome/Intel open source graphics driver (这个driver自动安装inte-ucode) |
| Audio | Pipewire |
| Network configuration | NetworkManager |
| Timezone | Shanghai |
| Additional repository | mutilib |

使用gnome可以使用向日葵，但是KDE不行

需要手动开启gdm

```bash
systemctl enable gdm
```

## 配置archlinuxcn软件源和aur

1. 编辑 `/etc/pacman.conf` 文件，在文件结尾加入 `archlinuxcn` 源

```bash
[archlinuxcn]
Server = https://mirrors.ustc.edu.cn/archlinuxcn/$arch # 中国科学技术大学开源镜像站
Server = https://mirrors.tuna.tsinghua.edu.cn/archlinuxcn/$arch # 清华大学开源软件镜像站
Server = https://mirrors.hit.edu.cn/archlinuxcn/$arch # 哈尔滨工业大学开源镜像站
Server = https://repo.huaweicloud.com/archlinuxcn/$arch # 华为开源镜像站
```

1. 刷新 `pacman` 数据库

```bash
sudo pacman -Syyu
```

2. 安装 `archlinuxcn` 源的 `key`

```bash
sudo pacman-key --lsign-key "farseerfc@archlinux.org" # 在本地信任key
sudo pacman -S archlinuxcn-keyring # cn源签名
```

3. 安装 `yay`

```bash
sudo pacman -S yay # yay在cn源里
```

## 安装Timeshift

1. 安装 `timeshift` 软件包

```bash
sudo pacman -S timeshift
```

2. 如果Timeshift没有自动备份，那么就需要手动开启 `cronie` 服务

```bash
sudo systemctl enable --now cronie.service
```

## 安装字体

- 英文字符： `noto-fonts`
- 中文字符： `noto-fonts-cjk`
- emoji： `noto-fonts-emoji`

字符中 `sans` 代表有衬线， `serif` 代表无衬线， `monospace` 代表等宽

## 安装中文输入法

1. 安装 `fcitx5` 软件包

```bash
sudo pacman -S fcitx5-im # 输入法基础包组
sudo pacman -S fcitx5-chinese-addons # 中文输入
```

2. 设置环境变量，编辑文件 `/etc/environment` 加入以下内容

```
GTK_IM_MODULE=fcitx5
QT_IM_MODULE=fcitx5
XMODIFIERS=@im=fcitx5
SDL_IM_MODULE=fcitx5
GLFW_IM_MODULE=ibus
```

3. 安装Gnome的输入法扩展

```bash
yay -S gnome-shell-extension-kimpanel-git
```

## 功耗控制

```bash
sudo pacman -S tlp tlp-rdw
sudo systemctl enable tlp.service
sudo systemctl enable NetworkManager-dispatcher.service # for tlp-rdw
sudo systemctl mask systemd-rfkill.service # 屏蔽以下服务以避免冲突，确保 TLP 无线设备的开关选项可以正确运行
sudo systemctl mask systemd-rfkill.socket
sudo tlp start # 手动开启tlp
```

之前电脑还是Windows系统的时候设置过电池充电阈值，可以使用tlp看到

```bash
sudo tlp-stat -b
```

根据显示信息进入 `/sys` 的相应目录可以将充电阈值改掉，以后只用TLP进行功耗管理

## Gnome桌面环境设置

1. dock

```bash
yay -S gnome-shell-extension-dash-to-dock
```

再在Extension程序里打开相应开关即可

2. 窗口最大化最小化按钮

Gnome鼓励使用 `super` 键或者 `ALT+TAB` 键切换应用，但是没有最大化和最小化还是不方便，安装了 `gnome-tweak` 之后，在Tweak程序里，选择Window选项卡就可以更改设置

## 安装其他常用软件

**pacman**

- `neofetch`

**aur**

- `wps-office-cn`
- `sunloginclient` ，向日葵安装完需要手动开启 `runsunloginclient.service`
- `microsoft-edge-stable`
- `zotero-bin`
- `realvnc-vnc-viewer`

---

以后如果有增加什么东西应该会往这里面添加吧，下一篇可能会写一写在搭建博客的时候踩过的坑。
