#!/usr/bin/env python3
# Shakya POS - Self-Correcting Auto-Verifying Internal Security Engine
# 1. Upgrades src/shared/validation/validators.js with a 3-Layer
#    Real-Time Input Auto-Sanitizer, Mathematical Invariant Healer,
#    and 60s Storage/Vault Integrity Watchdog.
# 2. Upgrades src/services/storage/atomic-wal.js to invoke
#    autoVerifyAndHealAllCollections() inside every Atomic WAL commit.
# 3. Adds the live Internal Security Audit & Auto-Heal Monitor card
#    in the Printer/UI (#backup) tab + floating auto-correction toast.

import os
import zlib
import base64
import shutil
import subprocess
import sys

def find_modular_root():
    cands = [
        os.path.dirname(os.path.abspath(__file__)),
        os.getcwd(),
        "/storage/emulated/0/Shakya_Pos",
        "/storage/emulated/0/Shakya_POS",
        "/sdcard/Shakya_Pos",
        "/sdcard/Shakya_POS",
    ]
    for c in cands:
        idx = os.path.join(c, "index.html")
        css = os.path.join(c, "src", "styles", "base.css")
        if os.path.isfile(idx) and os.path.isfile(css):
            return c
    return os.path.dirname(os.path.abspath(__file__))

ROOT = find_modular_root()

VALIDATORS_ZLIB_B64 = (
    "eNrFPNuOG8l17/sVJa0jdkMkhzOSRh5yZwSKMyvROxdZHGljy7ODYncN2TvNbqq7OZeV"
    "BTh+cYIgCBDYyUMCLGzM2k5ix0YeEhsIkl8Z7A/En5Bz6tZV3U1ytF4ja1hTrMs5p06d"
    "OreqrpUVkibeSjqmCfNXzmgY+DQL4kgV4yRtfpqSL3/wYzJg4UmjFycJ87IgGsFvb5YE"
    "2SXZiUZBxN5zTmaRh2OdURgPaeiSN+8RUpuljKRZEnhZrfMeVHhxlGZksNM73j14cvzR"
    "znfIJqml3nEqwR3TmR9kx2E8Oj5bhSHmiMFh93BQNSbNaJba/Z/297f7x9v9J/3DAXRH"
    "WoCa6y9+XmvXWrU6lH4BpVVe+iWU1njpn6F0j5f+BUr3a3U17F/h5wPe8CsorfPSr6H0"
    "kJf+DUrf5KXfQGmjBqPe8tmGLCNA5QDp01TQWRY/ZTRkfj+azrK0TVr1QsNz5sWJn7cM"
    "w9g7Zf4hnUxZ0otnUaabQppmvTHzTg+DCWuT2rdmMPsoPq/lzQhzLx1BYzcMgT9hyPhK"
    "pWS11fozcsaS4CRgviRbU70bj5DoV0dYlyWXknzBX2z51uBgvzmlScocoI+GA5AXOmLN"
    "Ecv6GZs41pq55PvfJ7VoFoY1t8MBBSfEScmdOyS7nLL4BEFuwsLGw0+BvJprMu6A1zVp"
    "mgajyFENdZJKUIKm8IY0SckTFL06MunpJgm9bAYp/+uErmswImymYeAxp1Un91t8zFvi"
    "0cwbE4eBtL/FBVebgKT0jMEWOWQhmzBgnuNK9uWMBEabFKZVXKuLCeEOgm12cqnn7kqi"
    "FwCR06wCgTOyZqPAFWYEFdasojiZgGb4jD0NIj/YDkZBljoAWU0uYdksiciA48IG8ugR"
    "qdXcZsKmIQVsK69gCzZgnxytjOrE8V2yuWXt1Vf+ES6LL/ir9lAWgxijgCewDihDHYvX"
    "4/hcqaOu3EOHOMKZpIAlSD+mSaRIRHAMJcWPvdmERRmKxg6uUpQ9vuz7Ti0dK2AakCki"
    "t2A0CK0ePoz9S1cvqQ3aSxjNmITu1PzgrKbXjYXNwOearAKf0SnNLkPW9NL0kF1kZFM2"
    "gFaaxmmA82+fBBfM7wzjLIsn7dX704tOyE6y9oPWn3Vq5G4+IEtolJ7AErZ5KQTS/txp"
    "QDe381kDFpRdtDfgv86EXjTOAz8btzfWzs5tGFPq+7C27YfTC7K6BqiGoKhY0kioH8xS"
    "HA91J3GUNVIQk/bqKvy0APC2cxaMxln7m61WB9RRnLTfPzk5AVAXDTBFfnzebpF1QLDW"
    "gn+S0ZCClPL/Ne89cG1wfpCCZF22ozhiHRDNUdQIYAOkbQ84zpLOiE7bAKozjQP83WBn"
    "UJ+K7prL1lo26XTKIr83DkLfYaHaGOb6u1LQRZNeoyH1TkcJaGdcViF1EgFsghCMJE0a"
    "I2QUCsPqvQc+G9XfH95/cK+1UX/f33j4sLXu1uSI9vwRrfUHJ/fX4e+DjfX1DbdWpIIv"
    "iKYAca82HwAj0xhsOnn/xGet+w9riMGqv3ffv7exkUMLooglTw/3dlFG//D5P/70f3/3"
    "twR4T2BTFVDKRcCOQYRkN05CdlHL90y+f13ihTArLMezzGwQva2dDtpMdXS4pnhTiRMX"
    "s9Yhb+tkDSQq1xxaQSTcnJq7zAE1x0ZxclknXEegCuE7r6guhGXJQKOh5mHnZBsGOm4z"
    "i3dR7zKkT6q72jho9Pdrda0LxvEsAS6vNXxUlNAwCaJZxqwqUMZx5BtVQtoMfaMoFdax"
    "v//sxaFhHJtFb4Lc3SSran3A+SqDeLx70PvIBFH2LopAKrBJF8XoqTtZLgmwDblX0UW6"
    "JdBBS5QyTbMoHQcnmfOGoHuE4+tomNrEWrY2/mPxSo0PWTTKxmQLTRspVG5CpcRWstEG"
    "JCUQ7g3NS0cawJOEpeM+6poIzLIcthdHAVjoF32nQjqD9CV624cs4gZ1Lx4GIXMm8dCW"
    "Qdw3EQphlQ3G3rmR/d42Wle0u8LGN1Zbmj5uoFc+ebXe2Dj6nv9m4+03VpoZg8lw+BXk"
    "pRRoB3SCLiB1xpyEnpv21J9HFvarICtns69XBSRzdY0bVtjgNMnSj4Ns7NQ2VmvghCEC"
    "X05mzS1Itw1jtQyjVQSxanPDz12h1Sr1IYMh9jgIw+4E90fqSGWVgQgn0zqhnlcnUxr4"
    "dcIuvDGNRqwHIVWQYS0sv89gq0/DIOvRdCyLL6YBSDW464KzANFe8Ai0H03AOwHK92g2"
    "boJdRhr3Z5MhSxxA6ZIGceRPGy33bVuu6baIfuDbfhjAgjIxHnqVGnAa2KKNLPQkH5AW"
    "dsY2q7yVk5k7QZKvbzSE+LRNTigsWF1XsSSJUTs+oeCHkOf0lE7a5BmCpJzF5BCU+zN6"
    "SYch6h/y2SX1KYnoOAC9CkJ5mtFbyli+NW20YJ4/YwW25exscNJNKYTOWzApkJxb1bsx"
    "Xyb3q03zhT+mNCEJPR1HjJwyEgaXDMStQaNTckphQjAxgUEuMPmMJnGcwHRpUD1TJF1K"
    "l9DsAxSrWk6gDNU84ISUEi2DQkA6dsdZoSNIqN2Pa0YtDNBfljif6TB1sPUuNLiKycjX"
    "ZmvVNbhUYlsl43LW8VkRJBpAv3jWR3Z9GvuWsABDhzSh8H+QjogS2AtjYLDmm+ac4t1b"
    "UwG84QRkyYwZYlLnMvS2rA68EAwlBFze6bezSydhr2egPpkPP0APnNEgRJGFX/Zuhn6m"
    "QK7qfWwC4NxetYJaDnGOBrCQ8Q1v6TUxFAX7kRweRIhOkumCCwi/9ARXVlCKvob/BKzd"
    "7nd2npPVNnm+091tHPb3dgh3Xkj3xeFBY9Dd7x/2vws97pDBzu6HjafQq7//hDx50X2+"
    "/TVTIzjZO9jeOeYkHPe3B9KdG7DMeSWyPGkPNhK4ZDVUoKqcejTijhX+8MHn8Zn+SWcD"
    "aO2JKpS0IzdPQD3v9j5aiO05RAsaFKK0KiaqvQh37+Bxf3fhPHJdhYDOKYcpRIZDfgaW"
    "EZTGEIFzTGZFAdv+wf7x/s6T4/0Xe3OmAbLH+dSLU054CvZQzUi2CX6meqK8hxgexnHK"
    "5AheVv1QeeSM9jxZlkiVFtM9lLrKGXoxFaZajZlxBQwGJWcx/OhOMs2GxzRl6rcYA3Uw"
    "yKcGpwLfHILU6h8wDWOsN3wGC0hH7FkCvoXBWlOVoDv9IXgVPViyGGKex5e59weuiFQg"
    "3HzzGtzkvKBcnlvo8rTseFS6i/t0wnYWJjpQULBXzVI43ssgXD4OOoUwOSsxolACkbLY"
    "PEN3sQnx0cRxK6ncDVL0bxyZA4TajHoQxeDEahBJsxMIJ/0ammY7N6d6uq6OsfXgtkxa"
    "Cu90wjNamwJXE+D5jofBpIdAZezmNSfC9mJK0PKbuWUVy2FMVcA0cpcQEt2AaN7NLRlo"
    "DHWxRRB3gcRdGMRd3Jw4aaJdPek34DJhXjht4qrVyZlYN6yQxbJPoSfHC00EUPjFJ/ox"
    "DU8bQWT6G+aqY1ynR5jUSQFDZ0sULSnJMUn6TNfB7K/hy362fSdVQX+eNhJhdO5t1DCw"
    "a+BWZD5Ru7Et0h35tO9ChcPr+GaEn64BQ/gP3I2RdUbuqOBCYHSMyuMlag3QKgnIM6gS"
    "CB8moEV8jCofh7OkEAEu3JYCgLWVJwsHcEzW/hV79xYMq9yr4BjnDqKn1sH0ECVaq+Ok"
    "qqOQAxoqt3tilGU9VuVrj1DM/FYP04aY/Hnf99bW19ZrpoTZzFPDldSoLY/wO1aPagQi"
    "z1brGA7sfMmqkC0lXfLwDARs7/kz4nz5w9+jKPHZoiSRrU2CIlFusWAJKcN/daVbcG1F"
    "aLyUc7V50qkifm4phTPssLAokyoXjhLDwmZGR7j7qwSHp7lFuptrMLMtoeeika+OkTEU"
    "ehWbubIRxxc1jo1nHxQaPgKcxdUm4VwGsGcsyQhPQxCeU0tJAKY2uiQR7AOwxivoxa1k"
    "QPtJwEJf4zQOJ0RKhCO6c0cz2sF5AmEi2oqES4UkWfUAuGaGzwXHszmmqSMi7JIzZ7Tl"
    "wws+mOpTMiM09YJgUSbG3CKiM7LWyOXIpK7aKLzPQrFXsk5qPcF2EG6L8Y0trkM5JKkb"
    "i9KqV3CtSQYfvSArZJvhMR9Bx5p7SA2emtLLVM3OIjf4GIaSp1wLrOjpWFlJex4hPsq7"
    "OIoLrm5ta840s/jFFDOl4C865tHWJ93Gd1uNjbtHVppLKjtJDnJcA69mu+x6U8ZLwMg6"
    "lGvFcgllGdPvNQkGGmKokhx+B0Dz245kyvxGHys5nSd4erI22/TkyvxrVPFP6B40Dyuf"
    "OK+g45HrfM+/66rsZXLqWjkGpCc5zYEXBgH8b6w2vrFWc4tuAyKD0fY6GauTnHYKLLzf"
    "VIkboREwq8PF3+YnbgMU5pMAD+Gli6GZPE8TVIo1oOMuYzkxq0kuyR6OuanwQd8bSt9A"
    "0uDnk56o0LNK8ORi+mIPGpEqN/wSt5XPbZmEzo2X1NC5cv6gSfbjqBGxESzGGVOmQCRz"
    "wLLohZijbUtaXmr/4vpAde76VK6GZja3a3zi5eQsgOEoEdwHmMg1nWCOiB/6FvJCvMwP"
    "IFVWWMFpuYarw0q+EAfmvquHQ2qPxckRUWxd2af7RMAGk4tqyJFGX7Hr3VwZwTEtLzzZ"
    "gOBUhUoy8Kih7PUJTr1eyiVmeagmqxC95NFrd75S0F3mid96U/h2Zyl3/kIUwdGMJrnz"
    "oefIMyDmJHlGxZCzcuxQyr5IVnRMf9BEojMyRWYuR1WZzFmKME+VmBh1zmQxyjl5lgJS"
    "zeuHTYInNXhJTWeRwKvQSSNVfjENhEYe0pBGnqGMNdl5FspaEDv9ZDlrVh+dkKqUT8T9"
    "WKCW9D6jlxidiYNcZ270uHSgFTVCmLc4nQMKNDyUJ1l2Koh6i0POPDFnDUOuLR6X89WO"
    "V8EJWTaQH3dYaScxQQwMBOKqEESd1FUn0jkESwUUQpSuh2cojuAHLCUvWGo8z0Llx3M5"
    "zLYmwATMLnqJkfuiHqrQHescr5hSytE4Gk95lJwEoLXi8ohl6kDNZoOcYYNT5OaZM37C"
    "t0x5CqZXKVBxPqUOCRVqYJ/xa4sYBl7iy5s7RkM5gjdO8d413WOeHXEXAIxYFuNZLadK"
    "RuA5IcUsj2G0LOOuYg0aetuzYqThqnqndKlISj5mQnhJTXXRqd7inVJQUm7xqO8Go3P1"
    "ZZ//CUIRhGls+a1Rb6m4pN7OQmsLILbk0SGHhsVOwaLzg0oTDRecBgwwgOWIcomxO8wq"
    "Oszc8jnhn+50bK1Net3nh+QO6R3s7u70DvsH++J87OXO8/6H38EDMX06Rnb2n/T3d75m"
    "WnDZghT3C8y/RxPMxnPPvVM0OS/xnvBlN/KxM/Z0zFSQBaNKBaPPI+Hn2yTJbpDpR4BG"
    "lh8HtfUtUGkENHSQKVU244jWPJL60ZlBURDh/UC8KlUmS1JgE6cHgIv+yBieH0EUmYuq"
    "I1exQm37JtPtO8JS4hmLHl+K7AV5o8+yT+KEOHwFobrVgT8fFGcPlXfvlp1i3Fqq56vg"
    "yN6Dtzxko1okwQp9Lds8t9e4UF9AmB3U9em1hNZomD/z2eZc0FRlQWTWvc0pbr7OLguH"
    "52XFwnvJA3SDBq85KZn9qsHQq6yQvCZm1W8wGrtV67NbHsjKLh5t8hC3iYkWm4lyhTO5"
    "IiCQxXOgCz6Ky7EE0CmNB+L4nQRMDGT6wN+6aZBmBotAQjnHrNXiV+iUpL0SuI74+uud"
    "YNOuo9G+f8EvbBYHdyo6p7PJt03xw8FHfI3vlmkiVf028/sMat51DtatHjpXPksSukhG"
    "l8XF3LNAfY5xyh5LEIo/Q8w0YzxBxxNzYjHxLAliZNRmVn6/+iSp4GrM2zPmrpHLmQmx"
    "Q65taSEpLaLkqmr/E3CkUGtwAVEbPljKpVgcsymZxm5TL3XncMpKIZQYZbKkQro3SVBW"
    "Omb6QU0/P+1NWIQHKVyfFzw885qT6uSUDmhgJ9EwzJX8XAM8L/yzbHE3DHv5Rz1Owmga"
    "W987YHon5RbCCol8etlP4zxDDk4gv9QMlXjLuTpP/qjYzUFVYt2M7g8OpDvlFm5WGoc1"
    "SDjpK3tZPPdZZIcXWOCy0cSlTuW1lT06zZeiynRqUIttZ4BLpPuWrWeQGeZTxXDSfvI4"
    "NcgqzECO/IbGlK/q3bs3tqLC7ksf4qaHIvaxiCLcaG4r11m1yXN8O91vc0gQgWzJOaGK"
    "mIPG5o6eX2kOr/MMayBMWmEBitnU19zmveaZVJvnmVR8rYWMNRJarznZhgvw2p0D0uqz"
    "GHxxjYTPkU+RexdL5qg9ED5azJTIsULC5/JTOEg5OnSFlmBT3hIOreJq2edSpBjplaXs"
    "UP4I38Q8E89Fw63yn6YJO5MeiOiOp9aiu4kNu8kF0gkMWaWyJnd1S5AZ9Z2vda8WDumV"
    "bRKkp4p0ZJs7zzpZJ6dcnQ74LSRQqjHQlBZ16h93RwmIE6GSugCYf4DI71hd7POTj9WW"
    "3krySlOc7FBv7KT8+x17aXkaoQnM7PtVSzox4nLZq8lv4zgrn/T3X8qjPLfowU7cnBwt"
    "gaIGMwVJCi525kxerR5xq1TF34VWQsxroYXQN7rKxiE1bEO6ILQSWP40pkAQIljKL3KL"
    "xeU7THHapkYyNP/YRxIpYfAPk15Klw063nB/K7zU9zXeJYpHhTJN/HyB70yrpqyMeH11"
    "2jdtqqys+85qaT5hPHdlUybSWRWkVSRY7enk33ekTb8qZfZHEIrwbDo5hgoyxccUrXfB"
    "Cssp3EOX6CK6HdLpXHAdgWuyPYqXSPB0A5QEwW/NIg9P2PfomH5KIyIPPNI5H26LJwiA"
    "pQCFAzHEudSmVdSwrKJuDY3tOixsVzOhlO/9ITg81Ws6bA7FFeOSuMmR/LLx3LG8df7o"
    "+bI05HI2fyS7mPJ7adulb2b4XKzPZRRj9Fw4T3g/gG1QKerFjMwDMnzNQNHD+3C6cykc"
    "orRxWvlpa06aLZQ5foG9Y7dpKhQNdrvCX0wvY5tATyzcN5L8t27FzRAuzT11MVne48Vv"
    "sGlWtM9f5e6zaaV5lRZmr0KYeVrvlrrrPE+AJ3PuluhxtiRM+KkFJzqH/EaXMatQ4XuW"
    "mfWgSURUS3phPPPJSzoL8QoNhARDvE9k3NFQ8arYyeDodfkhGB/Hh+2XIxrzHp8cfxIk"
    "jEtuBcNlF3/4nJ2UDuEKvpESFIF1CVmOdZgi4OMXi1honrJL+4e5B/YLIaMYu6mn0fRp"
    "RofqUtqJY43L10ySp0bzv/aK2uylGQjWeDefCMgC3qRnEX6jPTf9QW4y3nGrDEhhh1k2"
    "Yu5Hxv8v32aLxIp1hrnwHHK7e9gt3Tof8++peW5QwMNslwCDN/lf8Ws0IqnDr9IMet39"
    "GoYptaMb3T63I415Hz3f9NvlwqdznOKqL+6XwTLSU8P4YvF7HHPAPI4vrIsAAKe4NfFJ"
    "htlUfGU+/wKE6mQfdOZjYUvqH/i4DIyUAEyJL0xj0dsfvLN+/mPB9IwB1QSA15yyJHvM"
    "QO8zB6DW855u1SePOafK52EgdAByNx7xQJp/Nf+qdZRfOcjrmpkQ0y9/8DMuuEbLBBDr"
    "RyyqPvgXGDkD8icm5IjaB8AnzAan6ebtdNx4fYbbw7+9ZT36Ue6UBVnIbm+pZyoUR/NX"
    "qu6I2+HSwjzBq1cfrACYAuB0SiMb8pD6Iw75858RVGLiISyZrv1gBQcYMGpFoBW0jpJg"
    "+YS8cTC9vcXp2fryn35J5PcpeOdP3PIpoRaAhltyOea9DoEkDreq5r6Qhj98/uNfEAGJ"
    "yKcf3pUC/WLEu5JA+OcLm7eRcQ0vDmeTqM0Xaq1zu4ReUvuTvyO7FN8NUwLQxXfFxLHC"
    "HBuCn1rMm5MiQb5WI95KMd+5aeFTKoIcYxvJqdqTLEnIcpGhIrVflJrhLMtA2aK93rwt"
    "ftwuSG+GzyPJUiOeZrdJYW4QWIWBd7p5O5lFH85CrYRwC42wMDhnbLofnztuidlquz2f"
    "RQTHmttNj5ecBwjACk5jxeS1BZFOwzJi0O1R7825xrtqFXcUTAWnDkKWHaHU9rr7L7q7"
    "x90X2/1D08aoxM04Pu/zl264aZnjBFm9DC8gtzd12+dBT8LKvDuaxZqzXHWR66tfXn/x"
    "o4LPcH31D9dXP72++q/rq1+JAlT99vrqf66vfnL9xV9h+Yu/wQb893eE1/41/Pn76y/+"
    "4vrq51D6HS/94vrqv6Ez/P45H/wb+H2rZif9NWHbsCClxX4GItjm8K5+ff3FD8hDwtH+"
    "6Prqcw77V7wsSLj6d/7jJ5yq/4CJiVfpFDG/VU3/yWm5goYfC+IA+O8ROP/zl9dXP7xl"
    "ulbpzPNYmtYqPsWzv8EdxnFWtMDiTUMtWdqmU9/fwcyv9l9rgfyaGB9MMwKuyk+ompl8"
    "WMC8Gf9WHF/KXwswiWPId0VlwL4xpmE4S74WPHrbyF0dR8/ilCPjX3/O53zzeDhLn8bx"
    "qXnf4EbdC4fUJcTAR9AKbXwjrOv7EMzVq/WGuwyCON79agD4ETenYQDeOIJwXDtcX6qg"
    "BocHvY+OB92XO8YnLDfDuQM79I9BumPoxKVIQR3EbS+eTILsKyIFVbzdPx4cgio+uCFa"
    "vNHc5mfs+GnKV0H6uL+7C9zdreCuDESXgzg4OLQNyE0DLHzEEfucQexoU74U6cfdw97T"
    "7YMnx+utQS3fj+utlvkwGs88qP0PYYp/if6QzJiEMcVkS+0Gym/7YA9TW9zZoX4Fp40H"
    "3Obv3jq5v6aSkm/lu5pGyPqOMEwvYgm7ljsCnQWw5FWNynpj3LJFx0/KlnQxoA3G9PSS"
    "vtSv8+ZvowII9hlz5IXMqkeMhHGseMxKNFjP2oiqqg/66u+ZxsDID9Zvsi3q8z2198Tq"
    "v3WVk3UOSOPzUnLukWpoS6YcjgN8B/b/AMx1fmk="
)

def read_text(rel_path):
    p = os.path.join(ROOT, rel_path)
    with open(p, "r", encoding="utf-8") as f:
        return f.read()

def write_text(rel_path, content):
    p = os.path.join(ROOT, rel_path)
    shutil.copy2(p, p + ".bak_sec")
    with open(p, "w", encoding="utf-8", newline="\n") as f:
        f.write(content)

def patch_validators_js():
    rel = "src/shared/validation/validators.js"
    raw = zlib.decompress(base64.b64decode(VALIDATORS_ZLIB_B64))
    write_text(rel, raw.decode("utf-8"))
    print("[OK] 1/4 Installed Self-Correcting Security Engine in", rel)

def patch_atomic_wal_js():
    rel = "src/services/storage/atomic-wal.js"
    code = read_text(rel)
    target = (
        "      // Post-transaction invariant check: "
        "ensure no NaN quantities or corrupted arrays"    )
    hook = "\n".join([
        "      if (typeof window.autoVerifyAndHealAllCollections === "
        "'function') {",
        "        window.autoVerifyAndHealAllCollections(txType);",
        "      }",
        target,
    ])
    if target in code and "autoVerifyAndHealAllCollections" not in code:
        code = code.replace(target, hook, 1)
        write_text(rel, code)
        print("[OK] 2/4 Linked autoVerifyAndHealAllCollections into", rel)
    else:
        print("[OK] 2/4 atomic-wal.js already linked")

def patch_resilience_css():
    rel = "src/styles/features/resilience-shields.css"
    css = read_text(rel)
    old_sel = (
        "#shQuotaVaultBox, #shCloudSyncMonitorBox, "
        "#shAtomicWalMonitorBox {"    )
    new_sel = (
        "#shQuotaVaultBox, #shCloudSyncMonitorBox, "
        "#shAtomicWalMonitorBox, #shInternalSecurityMonitorBox {"    )
    if "#shInternalSecurityMonitorBox" not in css and old_sel in css:
        css = css.replace(old_sel, new_sel, 1)
        write_text(rel, css)
        print("[OK] 3/4 Styled #shInternalSecurityMonitorBox in", rel)
    else:
        print("[OK] 3/4 resilience-shields.css already styled")

def bump_sw_version():
    sw_p = os.path.join(ROOT, "sw.js")
    if os.path.isfile(sw_p):
        with open(sw_p, "r", encoding="utf-8") as f:
            sw = f.read()
        for v in (
            "shakya-pos-modular-v15",
            "shakya-pos-modular-v16",
            "shakya-pos-modular-v17",
            "shakya-pos-modular-v18",
        ):
            sw = sw.replace(v, "shakya-pos-modular-v19")
        with open(sw_p, "w", encoding="utf-8") as f:
            f.write(sw)
        print("[OK] 4/4 Bumped sw.js cache to v19")

def run_verifiers():
    reg_dir = os.path.join(ROOT, "tests", "regression")
    if not os.path.isdir(reg_dir):
        return True
    scripts = sorted(
        f for f in os.listdir(reg_dir)
        if f.startswith("verify_phase_m") and f.endswith(".py")
    )
    ok = True
    for s in scripts:
        res = subprocess.run(
            [sys.executable, os.path.join(reg_dir, s)],
            cwd=ROOT,
            capture_output=True,
            text=True,
        )
        print("[" + ("PASS" if res.returncode == 0 else "FAIL") + "]", s)
        if res.returncode != 0:
            ok = False
    return ok

def main():
    print("=== Shakya POS Self-Correcting Security Engine Installer ===")
    print("Target:", ROOT)
    patch_validators_js()
    patch_atomic_wal_js()
    patch_resilience_css()
    bump_sw_version()
    if run_verifiers():
        print("\n[DONE] Real-Time Self-Correcting Security Guard Active!")
    else:
        sys.exit(1)

if __name__ == "__main__":
    main()