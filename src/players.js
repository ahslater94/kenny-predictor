// Kenny World Cup 2026 — Player picks
// group1/2/3/4 = one team selected from each group
// Points: group win=20, group draw=10, group loss=0
// Knockout: points double each round (R32=40, R16=80, QF=160, SF=320, Final=640)
// Golden Boot correct = 100pts, Player of Tournament correct = 150pts
// england_goals = tiebreaker only

export const KENNY_PLAYERS = [
  { name: 'Kenneth',        group1: 'France',    group2: 'Uruguay',     group3: 'Czechia',      group4: 'DR Congo',     golden_boot: 'Kylian Mbappe',   pot: 'Michael Olise',    england_goals: 10 },
  { name: 'Sean',           group1: 'France',    group2: 'Ecuador',     group3: 'Czechia',      group4: 'Cape Verde',   golden_boot: 'Harry Kane',      pot: 'Michael Olise',    england_goals: 8  },
  { name: 'Anton',          group1: 'Norway',    group2: 'Japan',       group3: 'Scotland',     group4: 'New Zealand',  golden_boot: 'Harry Kane',      pot: 'Erling Haaland',   england_goals: 12 },
  { name: 'Julian',         group1: 'Germany',   group2: 'Japan',       group3: 'Ghana',        group4: 'South Africa', golden_boot: 'Harry Kane',      pot: 'Florian Wirtz',    england_goals: 14 },
  { name: 'Rhys',           group1: 'France',    group2: 'USA',         group3: 'Paraguay',     group4: 'DR Congo',     golden_boot: 'Kylian Mbappe',   pot: 'Harry Kane',       england_goals: 14 },
  { name: 'Foxy',           group1: 'Spain',     group2: 'Croatia',     group3: 'Egypt',        group4: 'DR Congo',     golden_boot: 'Harry Kane',      pot: 'Michael Olise',    england_goals: 12 },
  { name: 'Stephen',        group1: 'France',    group2: 'Uruguay',     group3: 'Egypt',        group4: 'Uzbekistan',   golden_boot: 'Julian Alvarez',  pot: 'Ousmane Dembele',  england_goals: 12 },
  { name: 'Conall',         group1: 'France',    group2: 'Croatia',     group3: 'Ghana',        group4: 'New Zealand',  golden_boot: 'Erling Haaland',  pot: 'Ousmane Dembele',  england_goals: 8  },
  { name: 'Matt',           group1: 'Spain',     group2: 'USA',         group3: 'Ghana',        group4: 'Saudi Arabia', golden_boot: 'Harry Kane',      pot: 'Ousmane Dembele',  england_goals: 13 },
  { name: 'Nathan',         group1: 'Brazil',    group2: 'Switzerland', group3: 'Scotland',     group4: 'Panama',       golden_boot: 'Kylian Mbappe',   pot: 'Harry Kane',       england_goals: 14 },
  { name: 'Podge',          group1: 'Spain',     group2: 'Mexico',      group3: 'Ivory Coast',  group4: 'Qatar',        golden_boot: 'Kylian Mbappe',   pot: 'Lamine Yamal',     england_goals: 17 },
  { name: 'Aodan',          group1: 'Spain',     group2: 'USA',         group3: 'Ivory Coast',  group4: 'New Zealand',  golden_boot: 'Kylian Mbappe',   pot: 'Lamine Yamal',     england_goals: 9  },
  { name: 'Aidan',          group1: 'France',    group2: 'Japan',       group3: 'Scotland',     group4: 'Curacao',      golden_boot: 'Kylian Mbappe',   pot: 'Kylian Mbappe',    england_goals: 11 },
  { name: 'Graham',         group1: 'England',   group2: 'Mexico',      group3: 'Scotland',     group4: 'Iraq',         golden_boot: 'Harry Kane',      pot: 'Harry Kane',       england_goals: 12 },
  { name: 'Nick',           group1: 'Spain',     group2: 'Ecuador',     group3: 'Paraguay',     group4: 'New Zealand',  golden_boot: 'Kylian Mbappe',   pot: 'Lamine Yamal',     england_goals: 15 },
  { name: 'Zane',           group1: 'Spain',     group2: 'Mexico',      group3: 'Egypt',        group4: 'New Zealand',  golden_boot: 'Harry Kane',      pot: 'Lamine Yamal',     england_goals: 13 },
  { name: 'Gregor',         group1: 'France',    group2: 'Croatia',     group3: 'Czechia',      group4: 'New Zealand',  golden_boot: 'Kylian Mbappe',   pot: 'Kylian Mbappe',    england_goals: 16 },
  { name: 'Maguire',        group1: 'France',    group2: 'Switzerland', group3: 'Czechia',      group4: 'DR Congo',     golden_boot: 'Kylian Mbappe',   pot: 'Lamine Yamal',     england_goals: 14 },
  { name: 'Kenneth Stones', group1: 'France',    group2: 'USA',         group3: 'Ivory Coast',  group4: 'New Zealand',  golden_boot: 'Kylian Mbappe',   pot: 'Michael Olise',    england_goals: 7  },
  { name: 'Martin Rice S',  group1: 'Spain',     group2: 'USA',         group3: 'Ivory Coast',  group4: 'South Africa', golden_boot: 'Harry Kane',      pot: 'Lamine Yamal',     england_goals: 16 },
  { name: 'Thomas Flanagan',group1: 'Brazil',    group2: 'Mexico',      group3: 'Egypt',        group4: 'Qatar',        golden_boot: 'Vinicius Jr',     pot: 'Lamine Yamal',     england_goals: 11 },
  { name: 'Gunnar',         group1: 'Brazil',    group2: 'Turkey',      group3: 'Czechia',      group4: 'Saudi Arabia', golden_boot: 'Mikel Oyarzabal', pot: 'Rodri',            england_goals: 14 },
];

// Group assignments for Kenny — which World Cup group each team belongs to
export const TEAM_GROUP = {
  // Group 1 teams (World Cup groups I, J, K, L roughly — France/Spain etc)
  'France': 'I', 'Spain': 'H', 'Germany': 'E', 'Brazil': 'C',
  'Netherlands': 'F', 'Belgium': 'G', 'Argentina': 'J', 'Portugal': 'K',
  'Norway': 'I', 'England': 'L', 'Morocco': 'C', 'Colombia': 'K',
  // Group 2 teams
  'Uruguay': 'H', 'Japan': 'F', 'Croatia': 'L', 'Mexico': 'A',
  'Ecuador': 'E', 'Sweden': 'F', 'USA': 'D', 'Switzerland': 'B',
  'Turkey': 'D', 'Austria': 'J', 'Senegal': 'I', 'Canada': 'B',
  // Group 3 teams
  'Czechia': 'A', 'Czech Republic': 'A', 'Scotland': 'C', 'Ghana': 'L',
  'Paraguay': 'D', 'Egypt': 'G', 'Ivory Coast': 'E', 'Algeria': 'J',
  'Scotland': 'C', 'Panama': 'L', 'Bosnia': 'B', 'Iraq': 'I',
  // Group 4 teams
  'DR Congo': 'K', 'Democratic Republic of the Congo': 'K',
  'Cape Verde': 'H', 'New Zealand': 'G', 'South Africa': 'A',
  'Uzbekistan': 'K', 'Saudi Arabia': 'H', 'Qatar': 'B',
  'Curacao': 'E', 'Curaçao': 'E', 'Iraq': 'I', 'Jordan': 'J',
  'Panama': 'L', 'Haiti': 'C', 'South Korea': 'A', 'Tunisia': 'F',
  'Iran': 'G', 'Algeria': 'J',
};
