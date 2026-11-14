# Figma — design tokens

Variables and text styles bound to the desktop home frame (`2:2`), as returned
by Figma. Other frames may bind tokens not listed here — when a fetched frame
reveals a new one, add it.

## Colours

| Variable                    | Value     |
| --------------------------- | --------- |
| `color/ink`                 | `#140d0a` |
| `color/surface-card`        | `#241612` |
| `color/surface-dark`        | `#38220f` |
| `color/border`              | `#3f2319` |
| `color/border-soft`         | `#55321f` |
| `color/primary`             | `#d28a4c` |
| `color/secondary`           | `#b39463` |
| `color/text-accent`         | `#e89b55` |
| `color/text-primary`        | `#f7f3ec` |
| `color/text-secondary`      | `#cfb28c` |
| `color/foreground`          | `#f5f1eb` |
| `color/background-elevated` | `#fbfbfb` |

A dark, warm-brown theme: `ink` is the darkest surface, text is cream.

## Typography

One family: **Roboto Mono** (`font/family`), weights 400, 500 and 700.

Line height `auto` is what Figma reports as `100` for the styles named
"lh auto" — confirm against the frame before fixing a value. Letter spacing is
in percent of the font size.

| Style                           | Size | Weight | Line height | Letter spacing |
| ------------------------------- | ---: | -----: | ----------- | -------------- |
| Display/43 Bold                 |   43 |    700 | 70          | 0              |
| Heading/24 Bold                 |   24 |    700 | auto        | 0              |
| Body Large/18 Bold · lh 24      |   18 |    700 | 24          | 0              |
| Body Large/18 Bold · lh 16      |   18 |    700 | 16          | 0              |
| Body Large/18 Regular           |   18 |    400 | 16          | 0              |
| Body Large/17 Bold              |   17 |    700 | 16          | 0              |
| Body Large/16 Bold · lh 20      |   16 |    700 | 20          | 0              |
| Body Large/16 Bold · lh auto    |   16 |    700 | auto        | 0              |
| Body Large/16 Medium · lh auto  |   16 |    500 | auto        | 0              |
| Body Large/16 Regular · lh auto |   16 |    400 | auto        | 0              |
| Body Large/16 Regular · lh 16   |   16 |    400 | 16          | 0              |
| Body/15 Bold · lh 40            |   15 |    700 | 40          | 0              |
| Body/15 Regular · lh 40         |   15 |    400 | 40          | 0              |
| Body/15 Medium                  |   15 |    500 | 16          | 0              |
| Body/15 Regular · lh 16         |   15 |    400 | auto        | 0              |
| Body/14 Bold · lh auto          |   14 |    700 | auto        | 10%            |
| Body/14 Medium · lh 20          |   14 |    500 | 20          | 0              |
| Body/14 Medium · lh 16          |   14 |    500 | 16          | 10%            |
| Body/14 Regular · lh 30         |   14 |    400 | 30          | 0              |
| Body/14 Regular · lh 24         |   14 |    400 | 24          | 0              |
| Body/14 Regular · lh 22         |   14 |    400 | 22          | 0              |
| Body/14 Regular · lh 16         |   14 |    400 | 16          | 0              |
| Caption/13 Regular · lh 22      |   13 |    400 | 22          | 0              |
| Caption/12 Bold                 |   12 |    700 | 14          | 0              |
| Tiny/10 Medium                  |   10 |    500 | auto        | 0              |
| Tiny/9 Bold                     |    9 |    700 | auto        | 0.1            |

## Not extracted yet

Spacing scale, radii, shadows and gradients are not exposed as variables on
this frame; read them from each frame's spec as screens are fetched and
consolidate them here.
