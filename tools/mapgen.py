import random, json, sys, math
random.seed(7)
BLOCK=set('#WTcbAPglonBK~vLf')  # '_' planks are walkable
def grid(w,h,fill): return [[fill]*w for _ in range(h)]
def rect(g,x0,y0,x1,y1,ch):
    for y in range(y0,y1+1):
        for x in range(x0,x1+1): g[y][x]=ch
def box(g,x0,y0,x1,y1,wall,floor=None):
    for y in range(y0,y1+1):
        for x in range(x0,x1+1):
            edge = x in (x0,x1) or y in (y0,y1)
            if edge: g[y][x]=wall
            elif floor: g[y][x]=floor
def put(g,x,y,ch): g[y][x]=ch
def out(g): return [''.join(r) for r in g]

maps={}
# ---------------- HOLLOWMERE 50x34
W,H=50,34
g=grid(W,H,',')
rect(g,0,1,49,1,'#'); rect(g,23,1,27,1,'=')       # north wall with gate
rect(g,45,0,46,33,'~'); rect(g,47,0,49,33,',')    # river
rect(g,24,0,26,33,'=')                            # main road
rect(g,2,16,44,17,'=')                            # E-W road
rect(g,18,12,32,21,'=')                           # square
put(g,25,16,'L')                                  # lantern tree
for (x,y) in [(22,14),(28,14),(22,18),(28,18)]: put(g,x,y,'l')
box(g,5,10,14,15,'W','W'); put(g,10,15,'D')       # inn
box(g,15,4,21,9,'W','W'); put(g,21,7,'D'); rect(g,22,7,23,7,':')   # town hall
box(g,29,3,34,7,'W','W'); put(g,29,5,'D'); rect(g,27,5,28,5,':')   # watch house
box(g,34,11,39,15,'W','W'); put(g,34,13,'D'); put(g,33,13,':'); put(g,33,11,'f')  # smithy + forge
box(g,34,18,39,21,'W','W'); put(g,34,19,'D'); put(g,33,19,':')    # quill's
box(g,38,4,43,8,'W','W'); put(g,41,8,'D'); rect(g,41,9,41,15,':')  # mill
rect(g,44,5,44,7,'w')                                              # mill race
box(g,4,24,9,28,'W','W'); put(g,9,26,'D'); rect(g,10,26,23,26,':') # wenna
for x in range(3,11): put(g,x,29,'n')
for (x,y) in [(3,23),(5,22),(7,23),(10,23),(10,29)]: put(g,x,y,'t')
box(g,10,19,14,22,'W','W'); put(g,12,19,'D'); put(g,12,18,':')    # pell's house
put(g,17,22,'o')                                                   # old well
for (x,y) in [(19,13),(20,13),(30,20),(31,20)]: put(g,x,y,'c')     # stalls
for (x,y) in [(20,19),(21,19)]: put(g,x,y,'K')                     # festival tables
put(g,31,13,'b'); put(g,19,20,'b')                                 # barrels of lamp oil
# trees, avoiding roads and building surroundings
def free_area(x,y):
    for dy in range(-1,2):
        for dx in range(-1,2):
            xx,yy=x+dx,y+dy
            if 0<=xx<W and 0<=yy<H and g[yy][xx] not in ',': return False
    return True
for _ in range(140):
    x,y=random.randrange(1,45),random.randrange(2,34)
    if free_area(x,y): put(g,x,y,random.choice('TTTt'))
for y in range(2,34):
    if g[y][0]==',': put(g,0,y,'T')
maps['hollowmere']=out(g)

# ---------------- INN 22x14
g=grid(22,14,'.')
box(g,0,0,21,13,'#')
rect(g,2,2,8,2,'K'); put(g,2,3,'K')            # bar counter
put(g,1,1,'B'); put(g,9,1,'f')                 # shelf, fireplace
for (x,y) in [(11,4),(13,4),(11,8),(15,8),(5,8),(7,10),(17,4)]: put(g,x,y,'K')   # tables
rect(g,19,1,20,3,'s')                           # stairs to rooms
put(g,10,13,'D')                                # front door

rect(g,18,9,18,12,'#'); rect(g,19,9,20,9,'#'); put(g,18,10,'D')
put(g,19,11,'B'); put(g,20,12,'c')
put(g,15,11,'b')
maps['inn']=out(g)

# ---------------- CATHEDRAL 36x30
g=grid(36,30,',')
box(g,6,3,29,22,'#','.')
rect(g,17,22,18,22,'D')                          # main doors
rect(g,13,4,22,7,'h')                            # dais
rect(g,17,5,18,5,'A')                            # altar
box(g,15,0,20,3,'#','.'); put(g,17,3,'#'); put(g,17,1,'s')  # hidden stair room; secret door at (17,3)
for y in range(9,21,2):
    for x in list(range(9,15))+list(range(21,27)): put(g,x,y,'+')
for y in range(6,22,3):
    put(g,8,y,'P'); put(g,27,y,'P')
box(g,24,4,29,10,'#','.'); put(g,24,7,'D'); put(g,27,8,'s'); put(g,28,5,'c')  # sacristy
box(g,0,8,6,15,'#','%'); put(g,6,11,'.'); put(g,6,12,'.'); put(g,3,11,'v')     # collapsed tower
for (x,y) in [(2,9),(4,13),(1,12)]: put(g,x,y,'%')
put(g,10,20,'%'); put(g,25,18,'%'); put(g,12,16,'%')
for (x,y) in [(9,6),(26,13),(9,15)]: put(g,x,y,'b') if False else None
rect(g,17,23,18,29,':')
for (x,y) in [(3,18),(5,20),(8,25),(11,24),(24,25),(27,24),(30,19),(32,23),(3,24),(13,27),(22,27),(29,27),(33,15)]: put(g,x,y,'g')
for (x,y) in [(1,2),(3,4),(32,2),(34,5),(33,9),(1,27),(34,28),(31,12),(2,21)]: put(g,x,y,'T')
maps['cathedral']=out(g)

# ---------------- UNDERCROFT 44x34
g=grid(44,34,'#')
rect(g,17,1,26,6,'.')                     # landing hall
rect(g,21,7,22,9,'.')                     # corridor south
rect(g,15,10,27,20,'.')                   # central crypt hall
for (x,y) in [(17,12),(25,12),(17,16),(25,16),(17,19),(25,19)]: put(g,x,y,'P')
rect(g,8,4,16,5,'.')                      # west corridor from landing
rect(g,8,6,9,9,'.')
rect(g,2,10,12,20,'.')                    # ossuary
for (x,y) in [(4,12),(6,17),(11,12),(10,19),(3,19),(9,11)]: put(g,x,y,'x')
for y in range(11,21,2): put(g,2,y,'g')
put(g,13,15,'.'); put(g,14,15,'D')        # ossuary <-> crypt
rect(g,3,6,5,9,'.'); put(g,4,6,'s')       # tower shaft landing
rect(g,6,7,7,7,'.')
rect(g,6,21,7,22,'.')                     # ossuary -> chapel corridor
rect(g,2,23,12,30,'.')                    # chapel of lira
rect(g,6,24,8,24,'h'); put(g,7,23,'A')
for (x,y) in [(3,26),(11,26),(3,29),(11,29)]: put(g,x,y,'P')
rect(g,27,2,34,3,'.')                     # east corridor to sacristy stair
rect(g,33,1,35,3,'.'); put(g,35,1,'s')
rect(g,30,10,42,20,'.')                   # dig site
for (x,y) in [(31,11),(32,12),(38,11),(40,13),(33,19),(31,17),(39,15),(36,12)]: put(g,x,y,'%')
rect(g,34,14,36,16,'%'); put(g,35,15,'v')  # excavation pit
rect(g,39,17,42,17,'%')                    # rubble trapping corvin
put(g,31,10,'b'); put(g,41,20,'b')
put(g,28,15,'.'); put(g,29,15,'.')         # crypt <-> dig
rect(g,33,4,34,9,'.')                      # corridor down to dig
rect(g,21,21,22,21,'.')                    # crypt -> sentinel chamber
rect(g,15,22,27,31,'.')                    # sentinel chamber
for (x,y) in [(16,23),(26,23),(16,30),(26,30)]: put(g,x,y,'P')
rect(g,20,26,22,28,'h')
put(g,18,24,'b'); put(g,25,29,'b')
rect(g,21,32,22,32,'D')                    # vault door (locked via object)
maps['undercroft']=out(g)

# ---------------- VAULT 27x22
g=grid(27,22,'#')
cx,cy=13,10
for y in range(1,21):
    for x in range(1,26):
        if ((x-cx)/12.5)**2+((y-cy)/9.6)**2<=1: g[y][x]='.'
rect(g,12,18,14,21,'.')
rect(g,11,2,15,4,'h'); put(g,13,3,'A')     # heart pedestal
for (x,y) in [(5,10),(21,10),(9,15),(17,15)]: put(g,x,y,'P')
put(g,7,4,'%'); put(g,19,4,'%'); put(g,4,13,'a'); put(g,22,13,'a')
maps['vault']=out(g)


# ================= ACT I MAPS =================
POI = {}
def poi(m, name, x, y): POI.setdefault(m, {})[name] = (x, y)

def scatter(g, ch, n, x0, y0, x1, y1, seed, avoid=',', margin=1):
    rnd = random.Random(seed)
    W, H = len(g[0]), len(g)
    for _ in range(n):
        x, y = rnd.randrange(x0, x1 + 1), rnd.randrange(y0, y1 + 1)
        ok = True
        for dy in range(-margin, margin + 1):
            for dx in range(-margin, margin + 1):
                xx, yy = x + dx, y + dy
                if 0 <= xx < W and 0 <= yy < H and g[yy][xx] != avoid: ok = False
        if ok: g[y][x] = ch

def line(g, pts, ch, width=1):
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        steps = max(1, abs(x1 - x0), abs(y1 - y0))
        for i in range(steps + 1):
            x = round(x0 + (x1 - x0) * i / steps); y = round(y0 + (y1 - y0) * i / steps)
            for w in range(width):
                for (dx, dy) in [(0, 0), (0, w), (w, 0)]:
                    if 0 <= y + dy < len(g) and 0 <= x + dx < len(g[0]): g[y + dy][x + dx] = ch

# ---------------- WHISPERING WOODS 56x40
g = grid(56, 40, ',')
scatter(g, 'T', 900, 0, 0, 55, 39, 11, margin=0)
for y in range(40):
    for x in range(56):
        if (x in (0, 55) or y in (0, 39)): g[y][x] = 'T'
# main path west -> east with branches
line(g, [(0, 20), (8, 20), (14, 17), (22, 19), (28, 20), (36, 18), (44, 20), (55, 20)], ':', 2)
line(g, [(14, 17), (12, 11)], ':', 2)          # to woodcutters
line(g, [(36, 18), (42, 12), (44, 9)], ':', 2)  # to Heartwood outpost
line(g, [(28, 20), (29, 27)], ':', 2)           # to the Whispering Stone
line(g, [(44, 20), (46, 28)], ':', 2)           # to Thornwake camp
# stream
for y in range(40):
    x = 30 + int(3 * math.sin(y / 5.0))
    for dx in range(2): g[y][x + dx] = 'w'
for y in (19, 20, 21):
    x = 30 + int(3 * math.sin(y / 5.0))
    for dx in range(-1, 3): g[y][x + dx] = ':'
for (x, y) in [(31, 34), (32, 35), (31, 35)]: g[y][x] = '~'
# woodcutters' camp
rect(g, 7, 7, 16, 13, ','); put(g, 11, 9, 'f')
for (x, y) in [(8, 8), (9, 8), (15, 8), (15, 12), (8, 12)]: put(g, x, y, 'c')
rect(g, 13, 7, 14, 7, 'K')
# Heartwood outpost: ring of trees, clearing, mound
cx, cy = 44, 9
for y in range(2, 17):
    for x in range(36, 53):
        d = ((x - cx) ** 2 + ((y - cy) * 1.2) ** 2) ** 0.5
        if d < 6.5: g[y][x] = ','
        elif d < 7.5: g[y][x] = 'T'
g[cy][cx] = 'h'; g[cy][cx - 1] = 'h'; g[cy + 1][cx] = 'h'; g[cy][cx + 1] = 'h'
for (x, y) in [(40, 6), (48, 6), (40, 12), (48, 12)]: g[y][x] = 't'
line(g, [(42, 12), (43, 14), (43, 16)], ':', 1)
g[16][43] = ':'; g[15][43] = ':'
# Whispering Stone: ring of standing stones around a cracked anchor-stone
for (x, y) in [(26, 27), (34, 27), (26, 33), (34, 33), (30, 26), (30, 34), (25, 30), (35, 30)]:
    rect(g, x - 1, y - 1, x + 1, y + 1, ',')
rect(g, 26, 27, 34, 33, ',')
for (x, y) in [(26, 27), (34, 27), (26, 33), (34, 33), (25, 30), (35, 30)]: g[y][x] = 'P'
g[30][30] = 'A'; g[29][30] = '.'; g[31][30] = '.'
line(g, [(29, 27), (30, 28)], ':', 1)
# Thornwake camp
rect(g, 42, 27, 52, 36, ',')
for (x, y) in [(43, 28), (44, 28), (51, 28), (51, 35), (43, 35)]: g[y][x] = 'c'
g[31][47] = 'f'
scatter(g, 't', 18, 42, 27, 52, 36, 5, margin=0)
for (x, y) in [(47, 30), (47, 32), (46, 31), (48, 31), (46, 28), (47, 28)]: g[y][x] = ','
line(g, [(46, 28), (47, 30)], ':', 1)
# gloam hollow (dark glade) south-west
rect(g, 6, 28, 15, 35, ','); scatter(g, 't', 10, 6, 28, 15, 35, 9, margin=0)
line(g, [(14, 17), (12, 24), (10, 29)], ':', 1)
maps['woods'] = out(g)
for k, v in {'entry_west': (1, 20), 'exit_east': (54, 20), 'woodcutter_fire': (11, 10), 'woodcutter_chief': (10, 10),
             'greenmother': (44, 8), 'outpost_gate': (43, 15), 'outpost_warden': (41, 9), 'anchor_stone': (30, 30), 'stone_approach': (30, 28),
             'thornwake_fire': (47, 31), 'caddoc': (46, 31), 'thornwake_guard': (46, 29), 'gloam_hollow': (10, 31), 'ford': (31, 20),
             'korr_spot': (11, 33), 'orren_spot': (36, 18), 'road_mid': (22, 19)}.items(): poi('woods', k, *v)

# ---------------- ASHENFORD 54x40
g = grid(54, 40, ',')
rect(g, 0, 30, 53, 33, '~')                       # river Sillow
rect(g, 26, 29, 28, 34, '_')                      # bridge
rect(g, 26, 0, 28, 29, '=')                       # main street
rect(g, 2, 21, 50, 22, '=')                       # river road
rect(g, 18, 11, 36, 19, '=')                      # market square
put(g, 27, 15, 'o')                               # fountain
for (x, y) in [(20, 12), (34, 12), (20, 18), (34, 18)]: put(g, x, y, 'l')
for (x, y) in [(22, 12), (23, 12), (31, 18), (32, 18)]: put(g, x, y, 'c')   # stalls
rect(g, 35, 35, 53, 39, ','); rect(g, 0, 34, 53, 39, ',')
rect(g, 26, 34, 28, 39, '=')                      # south road
# docks along north bank
rect(g, 30, 28, 46, 29, '_')
for (x, y) in [(32, 27), (33, 27), (40, 27), (44, 27)]: put(g, x, y, 'c')
for (x, y) in [(36, 27), (42, 28)]: put(g, x, y, 'b')
# buildings: (x0,y0,x1,y1,door)
B = {
 'garrison': (3, 2, 16, 9, (10, 9)),
 'conclave': (37, 2, 49, 8, (43, 8)),
 'hospice': (39, 11, 50, 18, (39, 15)),
 'glassworks': (3, 12, 13, 19, (13, 15)),
 'inn': (5, 23, 13, 28, (9, 23)),
 'wren': (31, 23, 36, 26, (33, 23)),
 'cooper': (39, 23, 44, 26, (41, 23)),
 'tenement': (47, 23, 52, 27, (49, 23)),
 'taxhouse': (18, 3, 24, 8, (24, 6)),
 'chapel': (30, 3, 35, 8, (30, 6)),
}
for name, (x0, y0, x1, y1, (dx, dy)) in B.items():
    box(g, x0, y0, x1, y1, 'W', 'W'); put(g, dx, dy, 'D')
# connect doors to roads
line(g, [(10, 10), (10, 11), (17, 11), (17, 13)], ':', 1)
line(g, [(43, 9), (43, 10), (38, 10), (37, 11)], ':', 1)
line(g, [(38, 15), (37, 15)], ':', 1)
line(g, [(14, 15), (17, 15)], ':', 1)
line(g, [(25, 6), (25, 6)], ':', 1)
line(g, [(29, 6), (29, 6)], ':', 1)
for (x, y) in [(12, 9), (13, 9), (14, 9), (3, 10), (16, 10)]: put(g, x, y, 'n')
for (x, y) in [(5, 13), (7, 13)]: put(g, x, y, 'W')
put(g, 2, 15, 'f'); put(g, 2, 17, 'f')            # kiln chimneys outside the glassworks wall
scatter(g, 'T', 40, 0, 34, 53, 39, 3, margin=1)
scatter(g, 'T', 14, 45, 10, 53, 20, 4, margin=1)
maps['ashenford'] = out(g)
for k, v in {'gate_north': (27, 1), 'bridge_south': (27, 38), 'square': (27, 14), 'fountain': (27, 15), 'mob': (24, 16), 'varek_spot': (25, 17),
             'garrison_door': (10, 10), 'garrison_officer': (11, 10), 'conclave_door': (43, 9), 'conclave_clerk': (44, 10),
             'hospice_door': (38, 15), 'ilyra_spot': (37, 16), 'glassworks_door': (14, 15), 'nima_father': (15, 14),
             'inn_door': (9, 22), 'tessa_spot': (10, 21), 'wren_door': (33, 22), 'wren_matron': (34, 21), 'cooper_door': (41, 22), 'cooper': (42, 21),
             'docks': (38, 28), 'brakka_spot': (35, 28), 'tax_door': (25, 6), 'chapel_door': (29, 6), 'merchant_glass': (21, 13), 'merchant_arms': (33, 13),
             'notice_board': (26, 12), 'tenement': (49, 22)}.items(): poi('ashenford', k, *v)

# ---------------- VALDROS (base = ruined) 48x40, with reality variants
def valdros(variant):
    g = grid(48, 40, ',')
    scatter(g, 'T', 160, 0, 0, 47, 39, 21, margin=1)
    for y in range(40):
        for x in range(48):
            if x in (0, 47) or y in (0, 39): g[y][x] = 'T'
    # city wall ring and streets
    box(g, 4, 3, 43, 36, '#')
    rect(g, 22, 36, 25, 36, '.')                  # south gate (broken)
    rect(g, 21, 37, 26, 38, '.')                  # the Old Path arrives outside the gate
    rect(g, 5, 4, 42, 35, '.')
    # avenue south -> north
    rect(g, 22, 4, 25, 35, '=')
    # cross avenue
    rect(g, 5, 19, 42, 21, '=')
    # buildings (ruined blocks)
    blocks = [(7, 6, 15, 12), (32, 6, 40, 12), (7, 24, 15, 32), (32, 24, 40, 32), (16, 25, 20, 32), (27, 25, 31, 32)]
    for (x0, y0, x1, y1) in blocks: box(g, x0, y0, x1, y1, '#', '.')
    # Senate Dome front at north: plaza 17..30, 4..9 ; gate at (23..24, 4) -> dome map exit placed at y=4
    rect(g, 17, 5, 30, 10, '.')
    box(g, 16, 3, 31, 4, '#'); rect(g, 23, 3, 24, 4, '%')   # dome gate collapsed (rubble, difficult but passable? no: wall)
    put(g, 23, 3, '#'); put(g, 24, 3, '#')
    # fountain plaza at crossing
    put(g, 23, 20, 'o'); put(g, 24, 20, 'o')
    # observatory (NW) - collapsed dome, Vaelis
    for (x, y) in [(10, 8), (12, 8), (10, 10)]: g[y][x] = 'P'
    g[9][11] = 'h'
    put(g, 11, 12, '.'); put(g, 12, 12, '.')   # broken observatory doorway
    # canals east/west at y=15..16 and 28 (dry in ruin)
    rect(g, 5, 15, 21, 16, '%'); rect(g, 26, 15, 42, 16, '%')
    # rubble and roots everywhere (ruin)
    scatter(g, '%', 60, 5, 4, 42, 35, 7, avoid='.', margin=0)
    scatter(g, 't', 45, 5, 4, 42, 35, 8, avoid='.', margin=0)
    # side entrance to the dome on the east (via canal) at (31,7) wall gap — blocked in ruin
    put(g, 31, 7, '#')
    if variant == 'flooded':
        rect(g, 5, 13, 42, 17, 'w'); rect(g, 18, 14, 29, 16, '~')
        rect(g, 22, 13, 25, 17, '_')            # avenue becomes a bridge
        rect(g, 31, 6, 31, 8, 'w'); put(g, 31, 7, 'w')   # canal reaches the dome's east side
        rect(g, 32, 6, 34, 8, 'w')
        for (x0, y0, x1, y1) in blocks[2:]: rect(g, x0 + 1, y0 + 1, x1 - 1, y1 - 1, 'w')
    elif variant == 'burning':
        for (x0, y0, x1, y1) in blocks[:2]: rect(g, x0 + 1, y0 + 1, x1 - 1, y1 - 1, 'F')
        rect(g, 16, 3, 18, 4, '%')              # the dome's west wall has fallen
        put(g, 17, 3, '%'); put(g, 16, 4, '%'); put(g, 18, 4, '%')
        scatter(g, 'F', 30, 5, 22, 42, 35, 12, avoid='.', margin=0)
    elif variant == 'inhabited':
        rect(g, 5, 4, 42, 35, '.')
        rect(g, 22, 4, 25, 35, '='); rect(g, 5, 19, 42, 21, '=')
        for (x0, y0, x1, y1) in blocks:
            box(g, x0, y0, x1, y1, 'W', 'W'); put(g, (x0 + x1) // 2, y1, 'D')
        rect(g, 17, 5, 30, 10, '.'); box(g, 16, 3, 31, 4, '#')
        put(g, 23, 3, 'D'); put(g, 24, 3, 'D'); put(g, 23, 4, '.'); put(g, 24, 4, '.')  # the great doors stand open
        put(g, 23, 20, 'o'); put(g, 24, 20, 'o')
        rect(g, 5, 15, 21, 16, '='); rect(g, 26, 15, 42, 16, '=')
        for (x, y) in [(20, 22), (27, 22), (20, 18), (27, 18)]: put(g, x, y, 'l')
        for (x, y) in [(10, 8), (12, 8), (10, 10)]: g[y][x] = 'P'
        g[9][11] = 'h'
        put(g, 31, 7, '#')
    return out(g)

maps['valdros'] = valdros('ruin')
maps['valdros@flooded'] = valdros('flooded')
maps['valdros@burning'] = valdros('burning')
maps['valdros@inhabited'] = valdros('inhabited')
for k, v in {'gate_south': (23, 37), 'avenue': (23, 30), 'fountain': (22, 20), 'observatory': (11, 10), 'vaelis_spot': (12, 10),
             'dome_plaza': (23, 7), 'dome_gate': (23, 3), 'dome_east': (31, 7), 'dome_west': (17, 3), 'flicker_west': (6, 20), 'flicker_east': (41, 20),
             'flicker_south': (24, 33), 'camp_spot': (24, 34), 'ambush_scout': (27, 9)}.items(): poi('valdros', k, *v)

# ---------------- VALDROS SENATE DOME 32x28
g = grid(32, 28, '#')
cx, cy = 16, 12
for y in range(1, 27):
    for x in range(1, 31):
        if ((x - cx) / 14.5) ** 2 + ((y - cy) / 11.5) ** 2 <= 1: g[y][x] = '.'
rect(g, 14, 22, 18, 27, '.')
for r in (5, 8):  # tiered benches
    for y in range(1, 27):
        for x in range(1, 31):
            d = (((x - cx) / 1.25) ** 2 + (y - cy) ** 2) ** 0.5
            if abs(d - r) < 0.5 and g[y][x] == '.' and not (14 <= x <= 18 and y > cy): g[y][x] = 'h'
put(g, 16, 12, 'A')
for (x, y) in [(6, 8), (26, 8), (6, 16), (26, 16), (11, 4), (21, 4)]: put(g, x, y, 'P')
put(g, 9, 20, 'b'); put(g, 23, 20, 'b')
put(g, 1, 12, '.'); put(g, 30, 12, '.')        # side entries (west, east)
maps['valdros_dome'] = out(g)
for k, v in {'entry_south': (16, 26), 'entry_west': (2, 12), 'entry_east': (29, 12), 'anchor': (16, 12), 'maren_spot': (16, 15),
             'ossaryx': (16, 7), 'vex': (16, 4), 'warden_a': (12, 6), 'warden_b': (20, 6), 'arcanist': (16, 3)}.items(): poi('valdros_dome', k, *v)

act1_checks = {
 'woods': ['entry_west', 'exit_east', 'woodcutter_chief', 'greenmother', 'outpost_gate', 'stone_approach', 'caddoc', 'gloam_hollow', 'korr_spot', 'orren_spot', 'ford', 'thornwake_guard'],
 'ashenford': [k for k in POI['ashenford'] if k != 'fountain'],
 'valdros': ['gate_south', 'avenue', 'fountain', 'vaelis_spot', 'dome_plaza', 'flicker_west', 'flicker_east', 'flicker_south', 'camp_spot', 'ambush_scout'],
 'valdros_dome': ['entry_south', 'entry_west', 'entry_east', 'maren_spot', 'ossaryx', 'vex', 'warden_a', 'warden_b', 'arcanist'],
}

# reachability check
def bfs(m,sx,sy):
    gg=maps[m]; H=len(gg); W=len(gg[0]); seen={(sx,sy)}; q=[(sx,sy)]
    while q:
        x,y=q.pop()
        for dx,dy in [(1,0),(-1,0),(0,1),(0,-1),(1,1),(1,-1),(-1,1),(-1,-1)]:
            xx,yy=x+dx,y+dy
            if 0<=xx<W and 0<=yy<H and (xx,yy) not in seen and gg[yy][xx] not in BLOCK:
                seen.add((xx,yy)); q.append((xx,yy))
    return seen
checks={'hollowmere':[(25,31),(25,0),(10,16),(22,7),(28,5),(33,13),(33,19),(41,9),(10,26),(12,18),(17,21),(11,26)],
 'inn':[(10,12),(19,2),(19,10),(12,5)],
 'cathedral':[(17,28),(17,21),(17,4),(23,7),(5,11),(25,7)],
 'undercroft':[(21,2),(4,7),(35,2),(8,15),(7,27),(21,15),(36,12),(40,18),(21,25),(21,31),(40,19)],
 'vault':[(13,20),(13,9),(13,5)]}
ok=True
# every named point must itself be walkable (bfs only checks neighbours)
for m, pts in POI.items():
    for n, (x, y) in pts.items():
        if n in ('fountain', 'anchor', 'anchor_stone', 'woodcutter_fire', 'thornwake_fire', 'observatory', 'dome_gate', 'dome_east', 'dome_west'): continue
        for mm in [k for k in maps if k == m or k.startswith(m + '@')]:
            if (mm, n) == ('valdros@inhabited', 'vaelis_spot'): continue  # Vaelis is not there in that reality
            if maps[mm][y][x] in BLOCK: print('POI ON BLOCKING TILE', mm, n, (x, y), maps[mm][y][x]); ok = False
for m, names in act1_checks.items():
    sx, sy = POI[m][names[0]]
    reach = bfs(m, sx, sy)
    for n in names[1:]:
        if POI[m][n] not in reach: print('UNREACHABLE', m, n, POI[m][n], maps[m][POI[m][n][1]][POI[m][n][0]]); ok = False
# Valdros: each reality opens one way into the dome
for var, gate in [('valdros@inhabited', (23, 4)), ('valdros@flooded', (31, 7)), ('valdros@burning', (17, 4))]:
    if gate not in bfs(var, 23, 37): print('NO DOME ROUTE in', var, gate, maps[var][gate[1]][gate[0]]); ok = False
if any(p in bfs('valdros', 23, 37) for p in [(23, 3), (31, 7), (17, 3)]): print('ruin variant should not reach the dome'); ok = False
for m in ['valdros', 'valdros@flooded', 'valdros@burning', 'valdros@inhabited']:
    r = bfs(m, 23, 37)
    for n in ['flicker_west', 'flicker_east', 'flicker_south', 'fountain']:
        if POI['valdros'][n] not in r: print('flicker unreachable', m, n); ok = False
for m,pts in checks.items():
    s=bfs(m,*pts[0])
    for p in pts[1:]:
        if p not in s: print('UNREACHABLE',m,p, maps[m][p[1]][p[0]]); ok=False
for m,gg in maps.items():
    assert all(len(r)==len(gg[0]) for r in gg), m
    print(m, len(gg[0]), 'x', len(gg))
with open(sys.argv[1],'w') as f:
    f.write('// Generated by the map builder (see DEVELOPMENT_STATUS.md). Each character is one 5-ft square.\n')
    f.write('// Legend: see data/maps/tiles.ts\n')
    f.write('export const GRIDS: Record<string, string[]> = ' + json.dumps(maps, indent=1) + ';\n')
    f.write('\n/** Named points of interest (x, y) per map, guaranteed walkable by the generator. */\n')
    f.write('export const POIS: Record<string, Record<string, [number, number]>> = ' + json.dumps(POI, indent=1) + ';\n')
print('ok' if ok else 'FAIL')
