import { useState, useCallback } from "react";
import { ExternalLink, Search, ChevronDown, Globe, Film, Gamepad2, Shield as ShieldIcon, Tv, Upload, X, Plus } from "lucide-react";

interface VaultLink {
  title: string;
  url: string;
  category: string;
}

// Clean Google redirect URLs
const clean = (u: string) => {
  try {
    const p = new URL(u);
    if (p.hostname.includes("google.com") && p.pathname === "/url") {
      const q = p.searchParams.get("q");
      if (q) return decodeURIComponent(q);
    }
  } catch {}
  return u;
};

const VAULT_LINKS: VaultLink[] = [
  // Proxies
  { title: "Shadow Proxy (Primary)", url: "https://nexthistory.banglaraloprotidin.com/", category: "Proxies" },
  { title: "Study Proxy (Backup)", url: "https://study.raisingpro.com/", category: "Proxies" },
  { title: "portal.muna.com", url: "https://portal.muna.com/", category: "Proxies" },
  { title: "study.ripcordengineering.com", url: "https://study.ripcordengineering.com/", category: "Proxies" },
  { title: "study.taskavonad.com", url: "https://study.taskavonad.com/", category: "Proxies" },
  { title: "portal.niles.xyz", url: "https://portal.niles.xyz/", category: "Proxies" },
  { title: "buy.robjonesbooks.com", url: "https://buy.robjonesbooks.com/", category: "Proxies" },
  { title: "study.razorlan.info", url: "https://study.razorlan.info/", category: "Proxies" },
  { title: "study.twnuu.com", url: "https://study.twnuu.com/", category: "Proxies" },
  { title: "mathhomework.tc-hs.org", url: "https://mathhomework.tc-hs.org", category: "Proxies" },
  { title: "howo.pages.dev", url: "https://howo.pages.dev", category: "Proxies" },
  { title: "use.veggiefit.ro", url: "https://use.veggiefit.ro/", category: "Proxies" },
  { title: "use.deploymentzone.com", url: "https://use.deploymentzone.com/", category: "Proxies" },
  { title: "use.silksky.com", url: "https://use.silksky.com/", category: "Proxies" },
  { title: "watch.maryejackson.com", url: "https://watch.maryejackson.com/", category: "Proxies" },
  { title: "viz.gorecycle.info", url: "https://viz.gorecycle.info", category: "Proxies" },
  { title: "card.thegalleryofart.org", url: "https://card.thegalleryofart.org", category: "Proxies" },
  { title: "trains.fenac.nl", url: "https://trains.fenac.nl", category: "Proxies" },
  { title: "newlink.ollemans.com", url: "https://newlink.ollemans.com", category: "Proxies" },
  // Emulators & ROMs
  { title: "GameBoy Advance ROMs", url: "https://drive.google.com/drive/folders/1pCXaEjukH0NsTsSCb1F0hNbjs8_-LMXf", category: "Emulators" },
  { title: "All ROMs Collection", url: "https://drive.google.com/drive/folders/1VxjINYMDvvUSRKA_k2aJqq6JzmRQCI1s", category: "Emulators" },
  { title: "EmulatorJS-main", url: "https://drive.google.com/drive/folders/1R2bxo2HHncBBTEBJE_4MteXnSWABJJqi", category: "Emulators" },
  { title: "RetroGames.cc", url: "http://www.retrogames.cc", category: "Emulators" },
  { title: "PlayEmulator", url: "http://www.playemulator.com", category: "Emulators" },
  { title: "ClassicReload", url: "http://www.classicreload.com", category: "Emulators" },
  { title: "Internet Arcade", url: "http://archive.org/details/internetarcade", category: "Emulators" },
  { title: "NESBox", url: "http://nesbox.com", category: "Emulators" },
  { title: "SNESFun", url: "http://snesfun.com", category: "Emulators" },
  { title: "GBGames.net", url: "http://gbgames.net", category: "Emulators" },
  { title: "PlayClassic Games", url: "http://www.playclassic.games", category: "Emulators" },
  { title: "Game Oldies", url: "http://www.game-oldies.com", category: "Emulators" },
  // Game Sites
  { title: "Poki", url: "http://www.poki.com", category: "Game Sites" },
  { title: "CrazyGames", url: "http://www.crazygames.com", category: "Game Sites" },
  { title: "CoolMathGames", url: "http://www.coolmathgames.com", category: "Game Sites" },
  { title: "Y8", url: "http://www.y8.com", category: "Game Sites" },
  { title: "Friv", url: "http://www.friv.com", category: "Game Sites" },
  { title: "ArmorGames", url: "http://www.armorgames.com", category: "Game Sites" },
  { title: "Newgrounds", url: "http://www.newgrounds.com", category: "Game Sites" },
  { title: "TBG95", url: "http://www.tbg95.com", category: "Game Sites" },
  { title: "Miniclip", url: "http://www.miniclip.com", category: "Game Sites" },
  { title: "AddictingGames", url: "http://www.addictinggames.com", category: "Game Sites" },
  { title: "Kongregate", url: "http://www.kongregate.com", category: "Game Sites" },
  { title: "Agame", url: "http://www.agame.com", category: "Game Sites" },
  { title: "Lagged", url: "http://www.lagged.com", category: "Game Sites" },
  { title: "SilverGames", url: "http://www.silvergames.com", category: "Game Sites" },
  { title: "GameFlare", url: "http://www.gameflare.com", category: "Game Sites" },
  { title: "Retro Bowl", url: "https://objectstorage.us-ashburn-1.oraclecloud.com/n/idzgyfi7awwr/b/bucket-20231001-1518-rb1.0/o/index.html", category: "Game Sites" },
  { title: "HahaGames", url: "https://www.hahagames.com/", category: "Game Sites" },
  { title: "CBC Kids Games", url: "https://www.cbc.ca/kids/games", category: "Game Sites" },
  // IO Games
  { title: "Krunker.io", url: "http://krunker.io", category: "IO Games" },
  { title: "Skribbl.io", url: "http://skribbl.io", category: "IO Games" },
  { title: "Slither.io", url: "http://slither.io", category: "IO Games" },
  { title: "Agar.io", url: "http://agar.io", category: "IO Games" },
  { title: "Diep.io", url: "http://diep.io", category: "IO Games" },
  { title: "Shell Shockers", url: "http://shellshock.io", category: "IO Games" },
  { title: "Bonk.io", url: "http://bonk.io", category: "IO Games" },
  { title: "Surviv.io", url: "http://surviv.io", category: "IO Games" },
  { title: "ZombsRoyale.io", url: "http://zombsroyale.io", category: "IO Games" },
  { title: "Paper.io", url: "http://paper-io.com", category: "IO Games" },
  // Unblocked Game Sites
  { title: "Unblocked Games 66", url: "http://sites.google.com/view/unblockedgames66", category: "Unblocked Sites" },
  { title: "Classroom 6x", url: "http://sites.google.com/view/classroom6x", category: "Unblocked Sites" },
  { title: "UBG 365", url: "http://sites.google.com/view/ubg365", category: "Unblocked Sites" },
  { title: "Unblocked Games WTF", url: "http://sites.google.com/view/unblockedgameswtf", category: "Unblocked Sites" },
  { title: "Unblocked Games Premium", url: "http://sites.google.com/view/unblockedgamespremium", category: "Unblocked Sites" },
  { title: "Unblocked Games 77", url: "http://sites.google.com/view/unblockedgames77", category: "Unblocked Sites" },
  { title: "Unblocked Games 333", url: "http://sites.google.com/view/unblockedgames333", category: "Unblocked Sites" },
  { title: "Unblocked Games 911", url: "http://sites.google.com/view/unblockedgames911", category: "Unblocked Sites" },
  { title: "UBG 44", url: "http://sites.google.com/view/ubg44", category: "Unblocked Sites" },
  { title: "Unblocked Games 99", url: "http://sites.google.com/view/unblockedgames99", category: "Unblocked Sites" },
  { title: "Unblocked Games 6969", url: "http://sites.google.com/view/unblockedgames6969", category: "Unblocked Sites" },
  { title: "Unblocked FreezeNova", url: "http://sites.google.com/view/unblockedgamesfreezenova", category: "Unblocked Sites" },
  { title: "Unblocked Games World", url: "http://sites.google.com/view/unblockedgamesworld", category: "Unblocked Sites" },
  { title: "Galactic Network", url: "https://galacticnetwork.org/", category: "Unblocked Sites" },
  { title: "99v.org", url: "https://99v.org", category: "Unblocked Sites" },
  { title: "Drift Boss Unblocked", url: "http://sites.google.com/view/driftbossunblocked", category: "Unblocked Sites" },
  { title: "Minecraft Unblocked", url: "http://sites.google.com/view/minecraft-unblocked", category: "Unblocked Sites" },
  { title: "Geometry Dash Unblocked", url: "http://sites.google.com/view/geometrydashunblocked", category: "Unblocked Sites" },
  // Community Sites
  { title: "Tesoar Network", url: "https://sites.google.com/view/tesoarnetwork/home", category: "Community" },
  { title: "Lots O Games", url: "https://sites.google.com/view/lotsogames", category: "Community" },
  { title: "Fort1nd", url: "https://www.fort1nd.com/homemenu", category: "Community" },
  { title: "Sir Site", url: "https://sites.google.com/view/sir-site-/home", category: "Community" },
  { title: "Math Is Super Funn", url: "https://sites.google.com/view/mathissuperfunn", category: "Community" },
  { title: "Fun Math Games By Friends", url: "https://sites.google.com/view/funmathgamesbyfreinds/home", category: "Community" },
  { title: "GXMX", url: "https://sites.google.com/view/gxmx", category: "Community" },
  { title: "Toothpaste Network", url: "https://toothpastenetwork.github.io", category: "Community" },
  { title: "Dominum Network", url: "https://sites.google.com/view/dominumnetworkv1/", category: "Community" },
  { title: "ZXS Games", url: "https://zxsgames.vip", category: "Community" },
  { title: "GL Series", url: "https://glseries.net/", category: "Community" },
  { title: "Mango Shark", url: "https://sites.google.com/view/mangoshark", category: "Community" },
  { title: "Sunset Learningz", url: "https://sites.google.com/view/sunsetlearningz/", category: "Community" },
  { title: "Op1um", url: "https://hubbleedu.github.io/op1um/", category: "Community" },
  { title: "Ryans Sussy Gaming", url: "https://hubbleedu.github.io/RSG/", category: "Community" },
  { title: "Gams", url: "https://hubbleedu.github.io/gams/", category: "Community" },
  { title: "Unblocked Cave", url: "https://hubbleedu.github.io/UC/", category: "Community" },
  // School Tools
  { title: "ClassLink MyApps", url: "https://myapps.classlink.com/home", category: "School Tools" },
  { title: "ClassLink Login", url: "https://login.classlink.com/my/lwsd", category: "School Tools" },
  { title: "Skyward", url: "https://www.q.wa-k12.net/lkwashSTS", category: "School Tools" },
  { title: "FlexiSCHED", url: "https://evergreen.flexisched.net/login", category: "School Tools" },
  // Streaming
  { title: "Netflix (Google Doc)", url: "https://docs.google.com/presentation/d/149GpUX0v2xNpwbUTv0Ra1bXSBJ8VImN3yQXMYA9ZhKA/edit#slide=id.g2c7d3bce1ae_0_22", category: "Streaming" },
  { title: "Disney+", url: "https://docs.google.com/presentation/d/1cqMoS7rNvOX77938GusdWNi6mYVPOfETCVsAVW9I9ps/edit#slide=id.p", category: "Streaming" },
  { title: "Hulu", url: "https://docs.google.com/presentation/d/1YDZCGRJMcIXA6CDnnxEUcNuZuEx-NdUETeeVFulhYDg/edit#slide=id.g2ce541b7098_0_1", category: "Streaming" },
  { title: "Roku", url: "https://docs.google.com/presentation/d/1OjrWHYHz5xbxhVYfWbDF4J0NdM3AYHC9x2pTchv4GuU/edit#slide=id.g26f6dcac621_1_0", category: "Streaming" },
  { title: "Paramount+", url: "https://docs.google.com/presentation/d/1CiZMdBm677M7EIus7gT89WPxwYPzXJQgwmXGv3sLAaw/edit#slide=id.g1b71f8bdb3c_2_77", category: "Streaming" },
  { title: "Tubi", url: "https://docs.google.com/presentation/d/1MKUZLOhfS1PyOtbz-uhfdNqewzDJIqZxBEfMeWPhJpE/edit#slide=id.g2d03a5085ad_0_68", category: "Streaming" },
  { title: "Movie Web", url: "https://moovie-web.vercel.app/#/search/movie", category: "Streaming" },
  { title: "Movie Web Meta", url: "https://movie-web-meta-refactor.vercel.app/#/search/movie", category: "Streaming" },
  { title: "Movie Web US", url: "https://movie-web.us/#/search/movie", category: "Streaming" },
  { title: "Kaido", url: "https://kaido.to/", category: "Streaming" },
  { title: "Flixwave", url: "https://flixwave.to/", category: "Streaming" },
  { title: "1HD Movies", url: "https://1hd.sh/movies/", category: "Streaming" },
  // Movies (Drive) — massive collection from the doc
  { title: "Deadpool & Wolverine", url: "https://drive.google.com/file/d/1aBzsoTJAjhZeFFDkIV2SN7p7ZHagUEDc/view?t=375", category: "Movies" },
  { title: "Spider-Man: Into the Spider-Verse", url: "https://drive.google.com/file/d/1OTFQcdnopehlWiqkPckWxkBk6TFNvNsm/view", category: "Movies" },
  { title: "Spider-Man: Across the Spider-Verse", url: "https://drive.google.com/file/d/1dSeZ1c4_p8T_lW7z0qpKsebKYN-R3zHR/view", category: "Movies" },
  { title: "Spider-Man: No Way Home", url: "https://drive.google.com/file/d/1oddQM8w-8UqQIvB-fPpy1h-7xvAbklmA/view", category: "Movies" },
  { title: "Spider-Man: Far From Home", url: "https://drive.google.com/file/d/1YFUpSLmxb6xIlbdJXScIkRYvwYxvJ_18/view", category: "Movies" },
  { title: "Spider-Man: Homecoming", url: "https://drive.google.com/file/d/1I9PYrrRLo1m_5Wtfq59L6gHGa3NaUXDv/view", category: "Movies" },
  { title: "Amazing Spider-Man 1", url: "https://drive.google.com/file/d/14BaJhmDRr3veoH436CKdPDp9r-j5214I/view", category: "Movies" },
  { title: "Amazing Spider-Man 2", url: "https://drive.google.com/file/d/1GLmG41OhRt9YfRa4r5nwvw8hCIS1Sofv/view", category: "Movies" },
  { title: "Inside Out 2", url: "https://drive.google.com/file/d/1SABVZNMwHTME4hsFwL9IWyWZPKDTBSoT/view?t=2499", category: "Movies" },
  { title: "Inside Out (2015)", url: "https://drive.google.com/file/d/1e0OdhlzTKWie6TDXNDOKjKYXbfYfmz6t/view?t=3777", category: "Movies" },
  { title: "Interstellar", url: "https://drive.google.com/file/d/1XQprw1tRflHUZ-cNl97ODxs9U5DvYAf-/view", category: "Movies" },
  { title: "IT (2017)", url: "https://drive.google.com/file/d/1BhQDbp8lXDwS-Q-pq4axufeZI-5TklpR/view", category: "Movies" },
  { title: "IT Chapter Two", url: "https://drive.google.com/file/d/1vLFTFzlvu9TJXbcL40gnag9Xart3pKQI/view", category: "Movies" },
  { title: "Terrifier 3", url: "https://drive.google.com/file/d/1sAj4FqfEIzHPIW7ZUPGGSOFTTaJr5AGI/view", category: "Movies" },
  { title: "Terrifier 2", url: "https://drive.google.com/file/d/1_Jjo7rOcCkYt3UryVkV2XvTfrL4QvHTE/view", category: "Movies" },
  { title: "Terrifier 1", url: "https://drive.google.com/file/d/1_pQ3kbz_a8l3B7SKfdP9dYQwKax0WHUD/view", category: "Movies" },
  { title: "Shrek 1", url: "https://drive.google.com/file/d/1ohXNP73ZyD2VISZZ0aV_rL2MSWskf9NX/view", category: "Movies" },
  { title: "Shrek 2", url: "https://drive.google.com/file/d/1xtr5zFmpt6iD89Tn8VthzEiBij89J9pZ/view", category: "Movies" },
  { title: "The Joker (2019)", url: "https://drive.google.com/file/d/1__wCd7uV9s7qY-o7qZ6F1lO9UQPV7B90/view", category: "Movies" },
  { title: "Avengers: Infinity War", url: "https://drive.google.com/file/d/1zpl7Dngm7ESW_yLZvcQMm9AhmR1izyus/view?t=2204", category: "Movies" },
  { title: "Super Mario Bros Movie", url: "https://drive.google.com/file/d/1OsyF2LKJqjtv0b2Xd9GWOLcYkzny3VZo/view?t=4", category: "Movies" },
  { title: "Despicable Me (2010)", url: "https://drive.google.com/file/d/1O1NlRelSTKmHf75-R2Q1MxN2tDM7qKdj/view", category: "Movies" },
  { title: "Despicable Me 2", url: "https://drive.google.com/file/d/1NkaXEdPuvzKG_LhBzL0cc_pYSxbx2WHY/view", category: "Movies" },
  { title: "Despicable Me 3", url: "https://drive.google.com/file/d/1wK-_cMu1BN6TOmXr486NqOAmcU_bX_lb/view", category: "Movies" },
  { title: "Despicable Me 4", url: "https://drive.google.com/file/d/1cV1LhzpEU6P6-pSfcG06W4ryQnggefPE/view", category: "Movies" },
  { title: "Wicked (2024)", url: "https://drive.google.com/file/d/14j1Jpjcw0vcyphIyx03LM-koNxSynTxS/view", category: "Movies" },
  { title: "Forrest Gump", url: "https://drive.google.com/file/d/0B-uFeCO4yCFIa3hNRDc5eVlBSjQ/view?t=6&resourcekey=0-rOslYKb17fIDWtuiy8P2ag", category: "Movies" },
  { title: "Godzilla x Kong", url: "https://drive.google.com/file/d/1h5vNxBZhabSuZdPvbGcFQN1x-xfURsfO/view", category: "Movies" },
  { title: "Sonic the Hedgehog", url: "https://drive.google.com/file/d/1HaXeNylNfZXhRudGTNLUWtrN-oAmone4/view", category: "Movies" },
  { title: "Space Jam: A New Legacy", url: "https://drive.google.com/file/d/1v2xqKQcAvndfcqsctZH73NR2AjFXsrUr/view", category: "Movies" },
  { title: "Home Alone 1", url: "https://drive.google.com/file/d/18YKNCTokG3B7ZWzCE3thunyDJMktLxnm/view", category: "Movies" },
  { title: "Home Alone 2", url: "https://drive.google.com/file/d/1Aj4Ys3ofogKhxEAMh6PUncpYF_OHZ_ZK/view", category: "Movies" },
  { title: "Five Nights at Freddy's", url: "https://drive.google.com/file/d/1OyO1OdhtfwR883Uvi0QPP5iooGcxTVSY/view", category: "Movies" },
  { title: "Scream IV", url: "https://drive.google.com/file/d/1kph0MTxbIHWar5DVkqmrZWiy5LuF9--A/view?t=3838", category: "Movies" },
  { title: "Scream 3", url: "https://drive.google.com/file/d/1IzaFo-PmeI3AiQ_qoDdjCbUdiu8Ohs-w/view", category: "Movies" },
  { title: "Curse of Chucky", url: "https://drive.google.com/file/d/1yVgcW1P624X4IWmdnq-hALiomKV61H6-/view", category: "Movies" },
  { title: "Cult of Chucky", url: "https://drive.google.com/file/d/1qPipvrYaINji65Pr6U9Wb8eLXR1PcggX/view?t=1", category: "Movies" },
  { title: "The Goonies", url: "https://drive.google.com/file/d/18sSKADZamG3w8ZaanP93XU4yHSVKzApM/view?t=4221", category: "Movies" },
  { title: "The Lorax", url: "https://drive.google.com/file/d/1Kl4ieKALPoEYbllsRy7V8AYiPtJATg7W/view", category: "Movies" },
  { title: "Deadpool 1", url: "https://drive.google.com/file/d/17QTeEVPc-E4YsWm-tQ4toG-DpLefpx4E/view?t=19", category: "Movies" },
  { title: "Deadpool 2", url: "https://drive.google.com/file/d/1tF1C-2tktolFSAJaLG0C2sE_2sGyH3YI/view?t=1", category: "Movies" },
  { title: "Saw 10", url: "https://drive.google.com/file/d/10Wn3otVUN00Sfc6sRZSnDFfaYDJ5VTNR/view?t=3039", category: "Movies" },
  { title: "Transformers: Rise of the Beasts", url: "https://drive.google.com/file/d/1epYCAJMFrmUBlId2wWFI0lcC1UvbX-Ez/view", category: "Movies" },
  { title: "Transformers: Dark of the Moon", url: "https://drive.google.com/file/d/1P3AU9onyXEKK03hRH63SKPoHbjPwMOFB/view", category: "Movies" },
  { title: "Star Wars: A New Hope", url: "https://drive.google.com/file/d/1aiJD6uDyAq9fQN2prN50djHHxmjTwQOC/view", category: "Movies" },
  { title: "Star Wars: Attack of the Clones", url: "https://drive.google.com/file/d/1u0ZRN7s8rgAMYtvnGf3zTjpM7Fu6TmW_/view", category: "Movies" },
  { title: "Star Wars: Revenge of the Sith", url: "https://drive.google.com/file/d/1lEszWnr2BinTfzBGqtoDV1W9wMIlTQtb/view", category: "Movies" },
  { title: "Halloween Kills", url: "https://drive.google.com/file/d/1CdhzdqiTQvWMCvmLE_zFLuc2jHvTMqq8/view?t=3", category: "Movies" },
  { title: "Halloween Ends", url: "https://drive.google.com/file/d/1Lsjj8VceEJMM4mvav7WOwhAH1X56-woA/view", category: "Movies" },
  { title: "Zootopia", url: "https://drive.google.com/file/d/1HYeIrbf8A-vfvJsvYP59AQzG9l8nt03h/view?t=2631", category: "Movies" },
  { title: "Freddy vs Jason", url: "https://drive.google.com/file/d/1njTri-d6eamwa3AFwuVD9nORZ7K6-D-N/view", category: "Movies" },
  { title: "Garfield Movie (2024)", url: "https://drive.google.com/file/d/1W0OfyIS_7f0DKjC6x1bVLI4WBFabZXis/view", category: "Movies" },
  { title: "Moana (2016)", url: "https://drive.google.com/file/d/1EsX8k7nfYQrzC6apqJqnyfH7HLAHl31G/view?t=2810", category: "Movies" },
  { title: "Salem's Lot (2024)", url: "https://drive.google.com/file/d/1PzQJ5iQOKas1DnXPUFsDsHbjEhR_bu1z/view", category: "Movies" },
  { title: "Kingdom of the Planet of the Apes", url: "https://drive.google.com/file/d/1dZ30bamkNV7OP9bJRF9bscboD9aRYaPY/view", category: "Movies" },
  { title: "Jurassic World Dominion", url: "https://drive.google.com/file/d/1x84uwAQzm7-j9MhDdNF5sb_jCRQFhjIa/view", category: "Movies" },
  { title: "Jurassic World: Fallen Kingdom", url: "https://drive.google.com/file/d/18c3GPXJiSXqyf75-oS-9k3wQUWpI-ap-/view", category: "Movies" },
  { title: "Ghostbusters: Frozen Empire", url: "https://drive.google.com/file/d/115NMznT9rm8LGZzRzE0OvgqCbP-_y-Ia/view", category: "Movies" },
  { title: "Beetlejuice Beetlejuice (2024)", url: "https://drive.google.com/file/d/1WnfCHnjlcN7joibU1e0RieYJNFBPgXRn/view", category: "Movies" },
  { title: "Brightburn (2019)", url: "https://drive.google.com/file/d/1j1cYjjEDqV8VcTJ3oSwaOeMHPglVd-um/view?t=18", category: "Movies" },
  { title: "TMNT: Mutant Mayhem", url: "https://drive.google.com/file/d/1emX4CShNejqhStNK-b0xDVBBMA0t2gcE/view", category: "Movies" },
  { title: "The Nun II", url: "https://drive.google.com/file/d/1CPZj45zQd1Ih-G0I7Ifo8dACj-4jbOJa/view?t=7", category: "Movies" },
  { title: "Annabelle (2014)", url: "https://drive.google.com/file/d/12sQn1gxallBigyxC2aDFUWsKqX_g-e-7/view", category: "Movies" },
  { title: "Cars 1", url: "https://drive.google.com/file/d/106N7zd611ShtPMOx97XwFSxkg8theQLN/view", category: "Movies" },
  { title: "Toy Story 1", url: "https://drive.google.com/file/d/1fW6Ov5NIaRh4h78-qBpWeln_Vs9oEXOQ/view?t=1", category: "Movies" },
  { title: "Toy Story 2", url: "https://drive.google.com/file/d/1k3RVDc_Vah1H9lFsXQZJ6mE3KqdDcK_T/view", category: "Movies" },
  { title: "SpongeBob: Sponge on the Run", url: "https://drive.google.com/file/d/1RCiXmbRfWyMQnJLa5vNTvSiIxZFG1mq5/view?t=5", category: "Movies" },
  { title: "The Wolverine (2013)", url: "https://drive.google.com/file/d/0BzeqnwcztH5cRERqUGl6TFkyc3M/view?resourcekey=0--S8rnshNZ6cP5uYrkFu3WA", category: "Movies" },
  { title: "Venom (2018)", url: "https://drive.google.com/file/d/1XoN0B1rsNKDDRphmI8bM606r4wRQ6JUH/view", category: "Movies" },
  { title: "Venom: Let There Be Carnage", url: "https://drive.google.com/file/d/1bcJ4X5WvyimpbB8U15Mb1j-kzct-nFIZ/view", category: "Movies" },
  { title: "Doctor Strange (2016)", url: "https://drive.google.com/file/d/11PAFLA_D94t0ZbSqcy-ggyl2DU7g0Ay2/view", category: "Movies" },
  { title: "Iron Man 3", url: "https://drive.google.com/file/d/1I3cDTsDBihDYId6KuKS6ighOcJ5g6oyC/view", category: "Movies" },
  { title: "Guardians of the Galaxy Vol. 2", url: "https://drive.google.com/file/d/0B-uFeCO4yCFIZXNnLUg3cVdiU3M/view?resourcekey=0-s1hwC6vvc_w-Q2CRrpP08g", category: "Movies" },
  { title: "Elf", url: "https://drive.google.com/file/d/1aus7IcL_iSNmvkKohgiZCjNoCmztRehu/view", category: "Movies" },
  { title: "Grown Ups 2", url: "https://drive.google.com/file/d/1igY-5wivsgwpd3tKUNZ_wcAmAbPpwMcz/view", category: "Movies" },
  { title: "Kung Fu Panda", url: "https://drive.google.com/file/d/0B5QJgBuViQvxMExwdFd4LXp1cjQ/view?resourcekey=0--AymX6yocYDSRtZ5jQFm1g", category: "Movies" },
  { title: "Rocky 1", url: "https://drive.google.com/file/d/0B7Z9hjzLxrtXZDBEZ29wOG90MGs/view?resourcekey=0-gY-cJTrxfMxIDBbPX33HyA", category: "Movies" },
  { title: "Trolls (2016)", url: "https://drive.google.com/file/d/0B3Oy5ahf02mFZU1KMG0xM0FYQXM/view?resourcekey=0-Mq9TLnk81W8W37eLt6Qelw", category: "Movies" },
  { title: "The Angry Birds Movie", url: "https://drive.google.com/file/d/0B4hN7fniyzpwalFxaEl3Tm5nLVU/view?resourcekey=0-ANoY0MoL3TgANh4nqeyZtQ", category: "Movies" },
  { title: "X-Men Origins: Wolverine", url: "https://drive.google.com/file/d/0BxvqXivT-hg5d2VmZDdsNlBNUzQ/view?resourcekey=0-QWd9FlwAU9FUyU3Ejx_Cqw", category: "Movies" },
  { title: "X-Men: Apocalypse", url: "https://drive.google.com/file/d/0B-J9Gkw1iO85XzhPMEN5LUVJakk/view?resourcekey=0-CM_D9L5sDkTcPNzyuXItiw", category: "Movies" },
  { title: "Pet Sematary: Bloodlines", url: "https://drive.google.com/file/d/122OjLQhI6uIS_qThRkLgUcgJh-U7PxBE/view", category: "Movies" },
  // YouTube Movies
  { title: "The Truman Show", url: "https://www.youtube.com/watch?v=C3wRLV2TGPQ", category: "YouTube Movies" },
  { title: "Click", url: "https://www.youtube.com/watch?v=1iG6sDpgt_k&t=20s", category: "YouTube Movies" },
  { title: "Good Burger", url: "https://www.youtube.com/watch?v=GyYJV1psDow", category: "YouTube Movies" },
  { title: "Mr. Bean's Holiday", url: "https://www.youtube.com/watch?v=t5ShVyghc3U&t=2s", category: "YouTube Movies" },
  // TV Shows
  { title: "Beast Games S01E01", url: "https://drive.google.com/file/d/1lxpivzn1LzchNkBncCNEN1azfabkr7gT/view", category: "TV Shows" },
  { title: "Beast Games S01E02", url: "https://drive.google.com/file/d/1LwX2NtrfqTYUWT_5A7JB_M1VCw-g-Jwk/view", category: "TV Shows" },
  { title: "Beast Games S01E03", url: "https://drive.google.com/file/d/1HFm-KTJU4HMfT0fzVmUsP9PBa6ELypGW/view", category: "TV Shows" },
  { title: "Beast Games S01E04", url: "https://drive.google.com/file/d/1GhN7K-J3w7F4GtltMPxMG9hQjh_xoaek/view", category: "TV Shows" },
  { title: "Beast Games S01E05", url: "https://drive.google.com/file/d/1AL0jbOfn_GqcJ2khfEMr5MnQqf6XTVq6/view", category: "TV Shows" },
  { title: "Squid Game S02E01", url: "https://www.dropbox.com/scl/fi/msnhwxwehfpn7wsh1i1xe/Squid-Game-S02E01-Bread-and-Lottery-Awafim.tv.mkv?rlkey=48pzzfss7yyrzmh69cr43bef4&st=12dpv69y&dl=0", category: "TV Shows" },
  { title: "Squid Game S02E02", url: "https://www.dropbox.com/scl/fi/1db3sg6c2cw7qhe4ltves/Squid-Game-S02E02-Halloween-Party-Awafim.tv.mkv?rlkey=85dbqh2gfb1ubzi93tovhwirk&st=zr4pa4q9&dl=0", category: "TV Shows" },
  { title: "Dexter S01E01", url: "https://drive.google.com/file/d/1skhRapfCogch4oyEneABmNsqqphuTwRA/view", category: "TV Shows" },
  { title: "Cobra Kai S01E01", url: "https://drive.google.com/file/d/1JU4wW3axueyByNhzs6y9zSbJHAEgka45/view", category: "TV Shows" },
  { title: "Family Guy Seasons 1-23", url: "https://drive.google.com/drive/folders/11W6C-Jqv9iQVasqjfiaYz77puax1UTjH?usp=drive_link", category: "TV Shows" },
  // Specific Games
  { title: "Slope (Drive)", url: "https://drive.google.com/file/d/14wuZeb1Er8p6D6V34VQkyq4Ycy0FJ4kc/view", category: "Specific Games" },
  { title: "TABS (Drive)", url: "https://drive.google.com/file/d/1O9EdIPMn2uMTf1AIJl9a0ThmgB9X4xx_/view", category: "Specific Games" },
  { title: "Happy Wheels", url: "https://script.google.com/macros/s/AKfycbyfMPVIGx6dJPrYKeE9e4Erj949-dH28pWVRjdV1vgnoylpBV8af03JNLoz2MwAIBLECg/exec", category: "Specific Games" },
  { title: "Eaglercraft (Minecraft)", url: "https://storage.googleapis.com/padlet-uploads/1465166829/7b89eec39e04ca34145de5dcc72c4b77/boomboom__1___1_.html", category: "Specific Games" },
  { title: "Townscaper", url: "https://oskarstalberg.com/Townscaper/", category: "Specific Games" },
  { title: "Particle Clicker", url: "https://particle-clicker.web.cern.ch/", category: "Specific Games" },
  { title: "Slope Game", url: "http://slopegame.com", category: "Specific Games" },
  { title: "Cookie Clicker", url: "http://orteil.dashnet.org/cookieclicker", category: "Specific Games" },
  { title: "Line Rider", url: "http://linerider.com", category: "Specific Games" },
  { title: "Little Alchemy 2", url: "http://littlealchemy2.com", category: "Specific Games" },
  { title: "Cut the Rope", url: "http://cuttherope.net", category: "Specific Games" },
  // Tools
  { title: "YouTube Downloader", url: "https://www.socialplug.io/free-tools/youtube-video-downloader", category: "Tools" },
  { title: "WebGL Fluid Sim", url: "http://paveldogreat.github.io/WebGL-Fluid-Simulation", category: "Tools" },
  { title: "Word Counter", url: "https://wordcounter.net/", category: "Tools" },
  { title: "Mirroring.tv", url: "http://mirroring.tv", category: "Tools" },
  { title: "GeoFS Flight Sim", url: "http://www.geo-fs.com", category: "Tools" },
];

const CATEGORIES = [...new Set(VAULT_LINKS.map((l) => l.category))];
const CATEGORY_ICONS: Record<string, typeof Globe> = {
  Proxies: ShieldIcon,
  Emulators: Gamepad2,
  "Game Sites": Gamepad2,
  "IO Games": Gamepad2,
  "Unblocked Sites": Globe,
  Community: Globe,
  "School Tools": ShieldIcon,
  Streaming: Film,
  Movies: Film,
  "YouTube Movies": Tv,
  "TV Shows": Tv,
  "Specific Games": Gamepad2,
  Tools: Globe,
};

const AUTO_CATEGORIES: { pattern: RegExp; category: string }[] = [
  { pattern: /proxy|shadow|study\.|portal\.|nexthistory|raisingpro|ultraviolet|rammerhead/i, category: "Proxies" },
  { pattern: /netflix|disney|hulu|roku|paramount|tubi|flixwave|1hd|moovie|kaido|streaming/i, category: "Streaming" },
  { pattern: /drive\.google\.com.*file.*view|dropbox.*\.mkv|dropbox.*\.mp4/i, category: "Movies" },
  { pattern: /youtube\.com\/watch/i, category: "YouTube Movies" },
  { pattern: /poki|crazygames|coolmath|y8\.com|friv|armorgames|newgrounds|tbg95|miniclip|addictinggames|lagged|silvergames|hahagames/i, category: "Game Sites" },
  { pattern: /\.io$|krunker|slither|agar\.io|diep\.io|shellshock|bonk\.io|surviv|zombsroyale|paper-io/i, category: "IO Games" },
  { pattern: /unblocked|classroom6x|ubg/i, category: "Unblocked Sites" },
  { pattern: /retrogames|playemulator|classicreload|nesbox|snesfun|emulator|rom/i, category: "Emulators" },
  { pattern: /squid.game|beast.game|dexter|cobra.kai|family.guy|s\d{1,2}e\d{1,2}/i, category: "TV Shows" },
  { pattern: /classlink|skyward|flexisched|school/i, category: "School Tools" },
  { pattern: /wordcounter|downloader|mirroring|fluid|geo-fs/i, category: "Tools" },
];

const guessCategory = (url: string, title: string): string => {
  const combined = `${url} ${title}`;
  for (const { pattern, category } of AUTO_CATEGORIES) {
    if (pattern.test(combined)) return category;
  }
  return "Uncategorized";
};

const LinksVault = () => {
  const [search, setSearch] = useState("");
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set(["Proxies"]));
  const [showImporter, setShowImporter] = useState(false);
  const [rawText, setRawText] = useState("");
  const [extraLinks, setExtraLinks] = useState<VaultLink[]>([]);
  const [importPreview, setImportPreview] = useState<VaultLink[]>([]);

  const toggleCat = (cat: string) => {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      return next;
    });
  };

  const parseRawText = useCallback((text: string) => {
    const urlRegex = /https?:\/\/[^\s<>"'`,)}\]]+/g;
    const lines = text.split("\n").filter(Boolean);
    const results: VaultLink[] = [];
    const seen = new Set<string>();

    for (const line of lines) {
      const urls = line.match(urlRegex);
      if (!urls) continue;
      for (const url of urls) {
        const cleanUrl = url.replace(/[.,;:!?)}\]]+$/, "");
        if (seen.has(cleanUrl)) continue;
        seen.add(cleanUrl);
        const beforeUrl = line.substring(0, line.indexOf(url)).replace(/[-–—:|•*#\d.]+$/, "").trim();
        const title = beforeUrl || new URL(cleanUrl).hostname.replace("www.", "");
        const category = guessCategory(cleanUrl, title);
        results.push({ title, url: cleanUrl, category });
      }
    }
    return results;
  }, []);

  const handlePreview = () => {
    const parsed = parseRawText(rawText);
    setImportPreview(parsed);
  };

  const handleImport = () => {
    setExtraLinks((prev) => [...prev, ...importPreview]);
    setImportPreview([]);
    setRawText("");
    setShowImporter(false);
  };

  const allLinks = [...VAULT_LINKS, ...extraLinks];
  const allCategories = [...new Set(allLinks.map((l) => l.category))];

  const filtered = search
    ? allLinks.filter((l) => l.title.toLowerCase().includes(search.toLowerCase()) || l.category.toLowerCase().includes(search.toLowerCase()))
    : allLinks;

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search links..."
            className="w-full pl-10 pr-4 py-2 bg-muted border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary text-sm"
          />
        </div>
        <button
          onClick={() => setShowImporter(!showImporter)}
          className="flex items-center gap-1.5 px-3 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:bg-primary/90 transition-colors"
        >
          <Upload className="w-3.5 h-3.5" />
          Bulk Import
        </button>
      </div>

      {showImporter && (
        <div className="border border-primary/30 bg-card rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Plus className="w-4 h-4 text-primary" /> Bulk Link Importer
            </h4>
            <button onClick={() => { setShowImporter(false); setImportPreview([]); setRawText(""); }} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Paste raw text with URLs — from Google Docs, notes, or any list. URLs are auto-detected and categorized.
          </p>
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder={"Paste URLs here, one per line or mixed with text...\n\nExample:\nShadow Proxy - https://nexthistory.banglaraloprotidin.com/\nhttps://drive.google.com/file/d/abc123/view"}
            className="w-full h-32 bg-muted border border-border rounded-lg p-3 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary resize-none font-mono"
          />
          <div className="flex gap-2">
            <button onClick={handlePreview} disabled={!rawText.trim()} className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg text-xs font-semibold hover:bg-secondary/80 transition-colors disabled:opacity-40">
              Preview ({rawText.trim() ? "parse" : "0"})
            </button>
            {importPreview.length > 0 && (
              <button onClick={handleImport} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:bg-primary/90 transition-colors">
                Import {importPreview.length} links
              </button>
            )}
          </div>

          {importPreview.length > 0 && (
            <div className="max-h-48 overflow-y-auto border border-border rounded-lg divide-y divide-border">
              {importPreview.map((link, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 text-xs">
                  <span className="px-1.5 py-0.5 bg-primary/10 text-primary rounded font-semibold text-[10px]">{link.category}</span>
                  <span className="flex-1 truncate text-foreground">{link.title}</span>
                  <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-muted-foreground">{filtered.length} links — admin/mod only</p>

      {allCategories.map((cat) => {
        const catLinks = filtered.filter((l) => l.category === cat);
        if (catLinks.length === 0) return null;
        const Icon = CATEGORY_ICONS[cat] || Globe;
        const isOpen = search || expandedCats.has(cat);

        return (
          <div key={cat} className="border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => toggleCat(cat)}
              className="w-full flex items-center gap-2 px-4 py-3 bg-card hover:bg-muted/50 transition-colors text-left"
            >
              <Icon className="w-4 h-4 text-primary shrink-0" />
              <span className="text-sm font-semibold text-foreground flex-1">{cat}</span>
              <span className="text-xs text-muted-foreground">{catLinks.length}</span>
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>
            {isOpen && (
              <div className="grid sm:grid-cols-2 gap-1 p-2 bg-muted/20">
                {catLinks.map((link, i) => (
                  <a
                    key={`${link.url}-${i}`}
                    href={clean(link.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted/60 transition-colors text-xs text-foreground"
                  >
                    <span className="flex-1 truncate">{link.title}</span>
                    <ExternalLink className="w-3 h-3 text-muted-foreground shrink-0" />
                  </a>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default LinksVault;
