const category_values_map: Record<string, any>= {
    'default': {color: {}, name: `等待选择`},
    '等待选择': { color: {backgroundColor: "#f64849"}, name: `等待点歌`, },
    '流行&动漫': { color: {backgroundColor: "#ff972a"}, name: `流行动漫`, },
    'niconico＆VOCALOID™': { color: {backgroundColor: "#02c8d3"}, name: `niconico`, },
    '舞萌': { color: {backgroundColor: "#f64849"}, name: `maimai`, },
    '东方Project': { color: {backgroundColor: "#ad59ee"}, name: `东方`, },
    '其他游戏': { color: {backgroundColor: "#4be070"}, name: `其他游戏`, },
    '音击/中二节奏': { color: {backgroundColor: "#3584fe"}, name: `音击/中二`, },
}
const track_tag_color_map: Record<string, React.CSSProperties>= {
    "std": {backgroundColor: "#3584fe"},
    "dx":  {backgroundColor: "#ffffff", color: "#FFBA84"},
}
const level_color_map: Record<string, React.CSSProperties> = {
    "mas": {backgroundColor: "#a051dc", color: "#ffffff"},
    "exp": {backgroundColor: "#ff828d", color: "#ffffff"},
    "adv": {backgroundColor: "#f7b807", color: "#000000"},
    "bas": {backgroundColor: "#6ed43e", color: "#ffffff"},
    "remas": {backgroundColor: "#ffffff", color: "#a051dc"},
}

export function CoverInfoStyle(coverInfo: string): React.CSSProperties{
    return track_tag_color_map[coverInfo];
}

export function SongInfoStyle(songInfo: string): React.CSSProperties{
    return level_color_map[songInfo.split("_")[0]];
}

export function SongInfoValue(songInfo: string): string{
    var split = songInfo.split("_");
    return split[split.length-1];
}


export function GenreInfoValue(genreInfo: string): string {
    return category_values_map[genreInfo].name
}

export function GenreInfoStyle(genreInfo: string): React.CSSProperties{
    return category_values_map[genreInfo].color
}