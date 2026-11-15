# Detalhes do NFT — desktop `10:244` e mobile `15:5536`

Obtido pela API REST (a cota do MCP acabou): `raw/10-244.json` e `raw/15-5536.json` são a fonte das medidas. Abaixo, a árvore resumida (posições relativas ao frame, `fill`, `stroke`, raio, auto layout e estilo de texto), gerada a partir do JSON. O footer foi omitido (ver [layout-shell](layout-shell.md)).

Gradientes do mobile: hero `#241612 → #2f1d15` (diagonal) e "Comprar NFT" `#d28a4c → #d28a4c/0.8`.

Ícones exportados em SVG para `public/icons/detail-*.svg`: lupa `70410:3935`, coração `70410:3941` e `15:5642` (mobile), estrela `I11:1195;11:1194`, LinkedIn `11:1245`, e-mail `11:1249`, Twitter `11:1247`, menos `70410:4192`, mais `70410:4196`, seta `I15:5745;29221:4976`, carrinho `I16:357;15:5525`.

## Desktop

```
FRAME "Desktop / Detalhes do NFT" 10:244 @0,0 1440x2246 fill=#140d0a VERTICAL gap=96 pad=24,120,24,120
  FRAME "Top" 70342:2770 @120,24 1200x553 VERTICAL gap=32 pad=0,0,0,0
    INSTANCE "Header Row" 70488:626 @120,24 1200x45 HORIZONTAL gap=undefined pad=0,0,0,0
      FRAME "Logo" I70488:626;70486:535 @120,24 160x34
        TEXT "KURIO Wordmark" I70488:626;70486:536 @120,32 48x18 fill=#f5f1eb [Roboto Mono 700 14/18 ls=1.40] "KURIO"
      FRAME "Nav" I70488:626;70486:537 @496,24 401x45 HORIZONTAL gap=40 pad=0,0,0,0
        TEXT "Início" I70488:626;70486:538 @496,24 58x21 fill=#f5f1eb [Roboto Mono 400 16/21 ls=0.00] "Início"
        FRAME "Nav Item" I70488:626;70486:539 @594,24 68x45 VERTICAL gap=24 pad=0,0,0,0
          TEXT "Mercado" I70488:626;70486:540 @594,24 68x21 fill=#e89b55 [Roboto Mono 700 16/21 ls=0.00] "Mercado"
          LINE "Active Underline" I70488:626;70486:541 @594,69 68x0 stroke=#d28a4c/3
        TEXT "Criadores" I70488:626;70486:542 @702,24 87x21 fill=#f5f1eb [Roboto Mono 400 16/21 ls=0.00] "Criadores"
        TEXT "Aprenda" I70488:626;70486:543 @829,24 68x21 fill=#f5f1eb [Roboto Mono 400 16/21 ls=0.00] "Aprenda"
      FRAME "Header Actions" I70488:626;70486:544 @1113,24 207x35 HORIZONTAL gap=28 pad=0,0,0,0
        VECTOR "Search Icon" I70488:626;70486:545 @1113,32 20x20 fill=#f5f1eb
        GROUP "Cart" I70488:626;70486:546 @1161,30 31x24
          VECTOR "Cart Icon" I70488:626;70486:547 @1161,30 24x24 fill=#f5f1eb
          ELLIPSE "Badge" I70488:626;70486:548 @1176,30 16x16 fill=#d28a4c stroke=#140d0a/2
          TEXT "Badge Count" I70488:626;70486:549 @1181,31 7x13 fill=#140d0a [Roboto Mono 500 10/13 ls=0.00] "6"
        GROUP "Login" I70488:626;70486:550 @1220,24 100x35 r=6
          FRAME "Login Button" I70488:626;70486:551 @1220,24 100x35 fill=#d28a4c r=6 VERTICAL gap=10 pad=0,0,0,0
            FRAME "Login Button Content" I70488:626;70486:552 @1229,31 82x21 HORIZONTAL gap=4 pad=0,0,0,0
              INSTANCE "Iconly/Curved/Logout" I70488:626;70486:553 @1229,31 20x20
                GROUP "Logout" I70488:626;70486:553;29221:4777 @1231,34 20x19
                  VECTOR "Stroke 1" I70488:626;70486:553;29221:4778 @1237,41 10x1 stroke=#140d0a/1.5
                  VECTOR "Stroke 3" I70488:626;70486:553;29221:4779 @1245,39 2x5 stroke=#140d0a/1.5
                  VECTOR "Stroke 4" I70488:626;70486:553;29221:4780 @1231,33 12x15 stroke=#140d0a/1.5
              TEXT "Entrar" I70488:626;70486:554 @1253,31 58x21 fill=#140d0a [Roboto Mono 500 16/21 ls=0.00] "Entrar"
    FRAME "Main" 70362:239 @120,101 1200x476 VERTICAL gap=12 pad=0,0,0,0
      TEXT "Início / Mercado" 10:290 @120,101 145x16 fill=#f5f1eb [Roboto Mono 700 15/16 ls=0.00] "Início / Mercado"
      FRAME "Product" 70342:2764 @120,129 1200x448 HORIZONTAL gap=32 pad=0,0,0,0
        FRAME "Product Images" 70363:239 @120,129 573x448 HORIZONTAL gap=28 pad=0,0,0,0
          RECTANGLE "Rectangle 74" 11:1074 @120,129 100x100 fill=#241612 r=6
          RECTANGLE "Rectangle 75" 11:1075 @120,245 100x100 fill=#241612 r=6
          RECTANGLE "Rectangle 76" 11:1076 @120,361 100x100 fill=#241612 r=6
          RECTANGLE "Rectangle 77" 11:1077 @120,477 100x100 fill=#241612 r=6
          FRAME "Thumbnails" 70342:2682 @120,129 100x448 VERTICAL gap=16 pad=0,0,0,0
            RECTANGLE "NFT Collection Artwork 04" 11:1181 @120,129 100x100 fill=IMG r=8
            RECTANGLE "NFT Collection Artwork 02" 11:1188 @120,245 100x100 fill=IMG stroke=#d28a4c/1 r=8
            RECTANGLE "NFT Collection Artwork 05" 11:1189 @120,361 100x100 fill=IMG r=8
            RECTANGLE "NFT Collection Artwork 03" 11:1190 @120,477 100x100 fill=IMG r=8
          FRAME "Main Image" 70342:2683 @248,131 444x444 fill=#241612 r=6 HORIZONTAL gap=10 pad=16,16,16,16
            RECTANGLE "NFT Collection Artwork 01" 11:1161 @268,151 404x404 fill=IMG r=24
          FRAME "Frame 399" 70410:3937 @650,144 30x30 HORIZONTAL gap=10 pad=0,0,0,0
            FRAME "Frame 238" 70380:2856 @650,144 30x30 HORIZONTAL gap=10 pad=0,0,0,0
              ELLIPSE "Ellipse 23" 11:1184 @650,144 30x30 fill=#2f1d15 stroke=#3f2319/1
              VECTOR "Vector" 70410:3935 @655,149 20x20 fill=#f5f1eb
        FRAME "Details" 70342:2763 @725,129 595x448 VERTICAL gap=20 pad=0,0,0,0
          FRAME "Frame 149" 70342:2686 @725,129 595x81 VERTICAL gap=12 pad=0,0,0,0
            FRAME "Frame 148" 70342:2685 @725,129 595x69 VERTICAL gap=12 pad=0,0,0,0
              TEXT "Emerald Ape #042" 11:1132 @725,129 595x37 fill=#f5f1eb [Roboto Mono 700 28/37 ls=0.00] "Emerald Ape #042"
              FRAME "Frame 147" 70342:2684 @725,178 595x20 HORIZONTAL gap=229 pad=0,0,0,0
                TEXT "1.19 ETH" 11:1141 @725,180 106x16 fill=#e89b55 [Roboto Mono 700 22/16 ls=0.00] "1.19 ETH"
                FRAME "Frame 40" 11:1210 @945,178 375x20 HORIZONTAL gap=4 pad=0,0,0,0
                  INSTANCE "Iconly/Bold/Star" 11:1195 @945,181 15x15
                    GROUP "Star" I11:1195;11:1193 @946,182 13x12
                      VECTOR "Star" I11:1195;11:1194 @946,182 13x12 fill=#d28a4c
                  INSTANCE "Iconly/Bold/Star" 11:1198 @964,181 15x15
                    GROUP "Star" I11:1198;11:1193 @965,182 13x12
                      VECTOR "Star" I11:1198;11:1194 @965,182 13x12 fill=#d28a4c
                  INSTANCE "Iconly/Bold/Star" 11:1201 @983,181 15x15
                    GROUP "Star" I11:1201;11:1193 @984,182 13x12
                      VECTOR "Star" I11:1201;11:1194 @984,182 13x12 fill=#d28a4c
                  INSTANCE "Iconly/Bold/Star" 11:1204 @1002,181 15x15
                    GROUP "Star" I11:1204;11:1193 @1003,182 13x12
                      VECTOR "Star" I11:1204;11:1194 @1003,182 13x12 fill=#d28a4c
                  INSTANCE "Iconly/Bold/Star" 11:1207 @1021,181 15x15
                    GROUP "Star" I11:1207;11:1193 @1022,182 13x12
                      VECTOR "Star" I11:1207;11:1194 @1022,182 13x12 fill=#cfb28c
                  TEXT "19 avaliações de colecionadores" 11:1191 @1040,178 280x20 fill=#f5f1eb [Roboto Mono 400 15/20 ls=0.00] "19 avaliações de colecionadores"
            LINE "Line 2" 11:1211 @725,210 573x0 stroke=#d28a4c/0.30000001192092896
          FRAME "Frame 150" 70342:2687 @725,223 574x94 VERTICAL gap=12 pad=0,0,0,0
            TEXT "Sobre este NFT:" 11:1214 @725,223 574x16 fill=#f5f1eb [Roboto Mono 700 15/16 ls=0.00] "Sobre este NFT:"
            TEXT "Um colecionável digital finalizado à mão da coleção Kurio Editions, verificado na Ethereum, com arte desbloqueável e acesso para colecionadores." 11:1215 @725,251 574x66 fill=#cfb28c [Roboto Mono 400 14/24 ls=0.00] "Um colecionável digital finalizado à mão da coleção Kurio Editions, verificado na Ethereum"
          FRAME "Frame 157" 70342:2696 @725,331 209x56 VERTICAL gap=12 pad=0,0,0,0
            TEXT "Edição:" 11:1216 @725,331 209x16 fill=#f5f1eb [Roboto Mono 700 15/16 ls=0.00] "Edição:"
            FRAME "Frame 156" 70342:2695 @725,359 209x28 HORIZONTAL gap=6 pad=0,0,0,0
              FRAME "Frame 155" 70342:2694 @725,359 36x28 HORIZONTAL gap=10 pad=6,4,6,4
                ELLIPSE "Ellipse 24" 11:1217 @725,359 36x28 stroke=#3f2319/1
                TEXT "1/1" 11:1219 @730,365 26x16 fill=#cfb28c [Roboto Mono 400 14/16 ls=0.00] "1/1"
              FRAME "Frame 152" 70342:2691 @767,359 42x28 HORIZONTAL gap=10 pad=6,4,6,4
                ELLIPSE "Ellipse 25" 11:1220 @767,359 42x28 stroke=#3f2319/1
                TEXT "1/10" 11:1221 @771,365 34x16 fill=#cfb28c [Roboto Mono 400 14/16 ls=0.00] "1/10"
              FRAME "Frame 153" 70342:2692 @815,359 46x28 HORIZONTAL gap=10 pad=6,6,6,6
                ELLIPSE "Ellipse 26" 11:1222 @815,359 46x28 stroke=#d28a4c/1
                TEXT "1/50" 11:1223 @821,365 34x16 fill=#e89b55 [Roboto Mono 500 14/16 ls=0.00] "1/50"
              FRAME "Frame 154" 70342:2693 @867,359 66x28 HORIZONTAL gap=10 pad=6,8,6,8
                ELLIPSE "Ellipse 27" 11:1224 @867,359 66x28 stroke=#3f2319/1
                TEXT "ABERTA" 11:1225 @874,365 51x16 fill=#cfb28c [Roboto Mono 400 14/16 ls=0.00] "ABERTA"
          FRAME "Frame 167" 70342:2762 @725,400 595x50 HORIZONTAL gap=16 pad=0,0,0,0
            GROUP "01" 11:1238 @725,400 103x50
              FRAME "Frame 160" 70342:2700 @725,400 103x50 HORIZONTAL gap=20 pad=0,0,0,0
                FRAME "Frame 48" 70410:4189 @725,400 103x50 HORIZONTAL gap=12 pad=0,0,0,0
                  FRAME "Add Button" 70410:4190 @725,400 33x50 fill=#d28a4c stroke=#140d0a/1 r=33 VERTICAL gap=undefined pad=0,0,0,0 fx=[["DROP_SHADOW",19.799999237060547,{"x":0,"y":6.599999904632568},"#140d0a/0.15"]]
                    FRAME "Frame" 70410:4191 @728,412 26x26
                      VECTOR "Vector" 70410:4192 @734,424 15x2 fill=#000000
                  TEXT "1" 70410:4200 @770,411 13x28 fill=#f5f1eb [Roboto Mono 400 20/28 ls=0.00] "1"
                  FRAME "Add Button" 70410:4194 @795,400 33x50 fill=#d28a4c stroke=#140d0a/1 r=33 VERTICAL gap=undefined pad=0,0,0,0 fx=[["DROP_SHADOW",19.799999237060547,{"x":0,"y":6.599999904632568},"#140d0a/0.15"]]
                    FRAME "Frame" 70410:4195 @798,412 26x26
                      VECTOR "Vector" 70410:4196 @804,417 15x15 fill=#000000
            FRAME "Frame 400" 70410:3938 @1052,400 268x40 HORIZONTAL gap=8 pad=0,0,0,0
              FRAME "Frame 161" 70342:2756 @1052,400 130x40 fill=#d28a4c r=6 HORIZONTAL gap=10 pad=0,0,0,0
                TEXT "COMPRAR" 11:1240 @1088,410 59x20 fill=#140d0a [Roboto Mono 700 14/20 ls=0.00] "COMPRAR"
              FRAME "Frame 162" 70342:2757 @1190,400 130x40 stroke=#d28a4c/1 r=6 HORIZONTAL gap=8 pad=0,0,0,0
                FRAME "heart 1" 70410:3940 @1203,410 20x20
                  VECTOR "Vector" 70410:3941 @1203,411 20x18 fill=#d28a4c
                TEXT "Favoritar" 11:1242 @1231,410 76x20 fill=#e89b55 [Roboto Mono 500 14/20 ls=0.00] "Favoritar"
          FRAME "Frame 166" 70342:2761 @725,463 308x114 VERTICAL gap=12 pad=0,0,0,0
            FRAME "Frame 164" 70342:2759 @725,463 308x84 VERTICAL gap=12 pad=0,0,0,0
              TEXT "ID do token: #0042" 10:291 @725,463 308x20 fill=#b39463 [Roboto Mono 400 15/20 ls=0.00] "ID do token: #0042"
              TEXT "Coleção: Kurio Apes" 11:1212 @725,495 308x20 fill=#b39463 [Roboto Mono 400 15/20 ls=0.00] "Coleção: Kurio Apes"
              TEXT "Atributos: Óculos, Esmeralda, Raro" 11:1226 @725,527 308x20 fill=#b39463 [Roboto Mono 400 15/20 ls=0.00] "Atributos: Óculos, Esmeralda, Raro"
            FRAME "Frame 165" 70342:2760 @725,559 272x18 HORIZONTAL gap=8 pad=0,0,0,0
              TEXT "Compartilhar este NFT:" 11:1244 @725,560 199x16 fill=#f5f1eb [Roboto Mono 700 15/16 ls=0.00] "Compartilhar este NFT:"
              VECTOR "Linkedin" 11:1245 @932,561 15x14 fill=#f5f1eb
              COMPONENT "Message" 11:1248 @955,559 18x18
                VECTOR "Vector 13 (Stroke)" 11:1249 @956,562 15x12 fill=#f5f1eb
              VECTOR "Twitter" 11:1247 @981,562 16x12 fill=#f5f1eb
  FRAME "Description" 70342:2780 @120,673 1200x340 VERTICAL gap=undefined pad=0,0,0,0
    FRAME "Frame 184" 70342:2779 @120,673 1200x316 VERTICAL gap=12 pad=0,0,0,0
      FRAME "Frame 183" 70342:2778 @120,673 1200x280 VERTICAL gap=undefined pad=0,0,0,0
        FRAME "Frame 182" 70342:2777 @120,673 1200x256 VERTICAL gap=12 pad=0,0,0,0
          FRAME "Frame 181" 70342:2776 @120,673 1200x220 VERTICAL gap=undefined pad=0,0,0,0
            FRAME "Frame 180" 70342:2775 @120,673 1200x196 VERTICAL gap=12 pad=0,0,0,0
              FRAME "Frame 179" 70342:2774 @120,673 1200x160 VERTICAL gap=12 pad=0,0,0,0
                FRAME "Frame 178" 70342:2773 @120,673 1200x28 VERTICAL gap=undefined pad=0,0,0,0
                  FRAME "Frame 177" 70342:2772 @120,673 530x28 HORIZONTAL gap=32 pad=0,0,0,0
                    FRAME "Frame 176" 70342:2771 @120,673 161x28 VERTICAL gap=12 pad=0,0,0,0
                      TEXT "Detalhes do NFT" 10:289 @120,673 161x16 fill=#e89b55 [Roboto Mono 700 17/16 ls=0.00] "Detalhes do NFT"
                      LINE "Line 6" 11:1252 @120,701 161x0 stroke=#d28a4c/3
                    TEXT "Avaliações de colecionadores (19)" 11:1253 @313,673 337x16 fill=#f5f1eb [Roboto Mono 400 17/16 ls=0.00] "Avaliações de colecionadores (19)"
                  LINE "Line 5" 11:1250 @120,701 1200x0 stroke=#d28a4c/0.30000001192092896
                TEXT "Emerald Ape #042 é uma obra digital 1/50 finalizada à mão da coleção Kurio Editions. Cada atributo fica armazenado nos metadados do token e verificado na Ethereum. A obra explora identidade, movimento e luz em um mundo digital sem fronteiras.  A propriedade inclui a arte em alta resolução, lançamentos exclusivos para colecionadores e um registro permanente de procedência registrada na rede. Nova Sato recebe 5% de direitos autorais nas vendas secundárias, apoiando novos trabalhos e lançamentos da comunidade." 11:1251 @120,713 1200x120 fill=#cfb28c [Roboto Mono 400 14/24 ls=0.00] "Emerald Ape #042 é uma obra digital 1/50 finalizada à mão da coleção Kurio Editions. Cada "
              TEXT "Rede:" 11:1258 @120,845 1200x24 fill=#f5f1eb [Roboto Mono 700 14/24 ls=0.00] "Rede:"
            TEXT "Cunhado na Ethereum com procedência imutável e metadados armazenados no IPFS." 11:1259 @120,869 1200x24 fill=#cfb28c [Roboto Mono 400 14/24 ls=0.00] "Cunhado na Ethereum com procedência imutável e metadados armazenados no IPFS."
          TEXT "Contrato:" 11:1260 @120,905 1200x24 fill=#f5f1eb [Roboto Mono 700 14/24 ls=0.00] "Contrato:"
        TEXT "Creator royalty: 5% on secondary sales, paid automatically by supported marketpl" 11:1261 @120,929 1200x24 fill=#cfb28c [Roboto Mono 400 14/24 ls=0.00] "Direitos autorais do criador: 5% nas vendas secundárias, pagos automaticamente pelos merca"
      TEXT "Direitos autorais:" 11:1262 @120,965 1200x24 fill=#f5f1eb [Roboto Mono 700 14/24 ls=0.00] "Direitos autorais:"
    TEXT "0x7A42...19E8 • Contrato inteligente ERC-721 verificado." 11:1263 @120,989 1200x24 fill=#cfb28c [Roboto Mono 400 14/24 ls=0.00] "0x7A42...19E8 • Contrato inteligente ERC-721 verificado."
  FRAME "Related Products" 70364:239 @120,1109 1200x407 VERTICAL gap=32 pad=0,0,0,0
    FRAME "Section Heading" 70342:2782 @120,1109 1200x28 VERTICAL gap=12 pad=0,0,0,0
      TEXT "Mais desta coleção" 11:1256 @120,1109 1200x16 fill=#e89b55 [Roboto Mono 700 17/16 ls=0.00] "Mais desta coleção"
      LINE "Line 7" 11:1254 @120,1137 1200x0 stroke=#d28a4c/0.30000001192092896
    FRAME "Frame 204" 70342:2800 @120,1169 1200x347 VERTICAL gap=32 pad=0,0,0,0
      FRAME "Frame 203" 70342:2799 @120,1169 1200x303 HORIZONTAL gap=28 pad=0,0,0,0
        FRAME "Frame 202" 70342:2798 @120,1169 219x303 VERTICAL gap=12 pad=0,0,0,0
          GROUP "Group 41" 11:1264 @120,1169 219x255
            FRAME "Frame 193" 70342:2789 @120,1169 219x255 fill=#241612 HORIZONTAL gap=10 pad=4,12,8,20
              RECTANGLE "NFT Collection Artwork 06" 11:1177 @140,1173 190x243 fill=IMG r=11
          FRAME "Frame 188" 70342:2783 @120,1436 154x36 VERTICAL gap=undefined pad=0,0,0,0
            TEXT "Cosmic Bloom #118" 11:1133 @120,1436 154x20 fill=#f5f1eb [Roboto Mono 400 15/20 ls=0.00] "Cosmic Bloom #118"
            TEXT "1.29 ETH" 11:1142 @120,1456 154x16 fill=#e89b55 [Roboto Mono 700 16/16 ls=0.00] "1.29 ETH"
        FRAME "Frame 201" 70342:2797 @365,1169 220x303 VERTICAL gap=12 pad=0,0,0,0
          GROUP "Group 42" 11:1265 @365,1169 220x255
            FRAME "Frame 194" 70342:2790 @365,1169 220x255 fill=#241612 HORIZONTAL gap=10 pad=20,4,24,4
              RECTANGLE "NFT Collection Artwork 07" 11:1178 @369,1189 212x212 fill=IMG r=13
          FRAME "Frame 189" 70342:2785 @365,1436 154x36 VERTICAL gap=undefined pad=0,0,0,0
            TEXT "Violet Nomad #314" 11:1136 @365,1436 154x20 fill=#f5f1eb [Roboto Mono 400 15/20 ls=0.00] "Violet Nomad #314"
            TEXT "1.39 ETH" 11:1145 @365,1456 154x16 fill=#e89b55 [Roboto Mono 700 16/16 ls=0.00] "1.39 ETH"
        FRAME "Frame 200" 70342:2796 @611,1169 219x303 VERTICAL gap=12 pad=0,0,0,0
          GROUP "Group 43" 11:1266 @611,1169 219x255
            FRAME "Frame 195" 70342:2791 @611,1169 219x255 fill=#241612 HORIZONTAL gap=10 pad=20,4,24,4
              RECTANGLE "NFT Collection Artwork 08" 11:1179 @615,1189 212x212 fill=IMG r=13
          FRAME "Frame 190" 70342:2786 @611,1436 145x36 VERTICAL gap=undefined pad=0,0,0,0
            TEXT "Ivory Baron #088" 11:1139 @611,1436 145x20 fill=#f5f1eb [Roboto Mono 400 15/20 ls=0.00] "Ivory Baron #088"
            TEXT "1.79 ETH" 11:1148 @611,1456 145x16 fill=#e89b55 [Roboto Mono 700 16/16 ls=0.00] "1.79 ETH"
        FRAME "Frame 199" 70342:2795 @856,1169 219x303 VERTICAL gap=12 pad=0,0,0,0
          GROUP "Group 44" 11:1267 @856,1169 219x255
            FRAME "Frame 196" 70342:2792 @856,1169 219x255 fill=#241612 HORIZONTAL gap=10 pad=16,4,28,4
              RECTANGLE "NFT Collection Artwork 09" 11:1180 @860,1185 213x213 fill=IMG r=13
          FRAME "Frame 191" 70342:2787 @856,1436 145x36 VERTICAL gap=undefined pad=0,0,0,0
            TEXT "Golden Beat #207" 11:1134 @856,1436 145x20 fill=#f5f1eb [Roboto Mono 400 15/20 ls=0.00] "Golden Beat #207"
            TEXT "0.99 ETH" 11:1143 @856,1456 145x16 fill=#e89b55 [Roboto Mono 700 16/16 ls=0.00] "0.99 ETH"
        GROUP "Group 45" 11:1268 @1101,1169 219x303
          FRAME "Frame 198" 70342:2794 @1101,1169 219x303 VERTICAL gap=12 pad=0,0,0,0
            FRAME "Frame 197" 70342:2793 @1101,1169 219x255 fill=#241612 HORIZONTAL gap=10 pad=16,4,28,4
              RECTANGLE "NFT Collection Artwork 10" 11:1182 @1105,1185 213x213 fill=IMG r=13
            FRAME "Frame 192" 70342:2788 @1101,1436 163x36 VERTICAL gap=undefined pad=0,0,0,0
              TEXT "Golden Signal #160" 11:1140 @1101,1436 163x20 fill=#f5f1eb [Roboto Mono 400 15/20 ls=0.00] "Golden Signal #160"
              TEXT "0.39 ETH" 11:1149 @1101,1456 163x16 fill=#e89b55 [Roboto Mono 700 16/16 ls=0.00] "0.39 ETH"
      FRAME "Carousel Dots" 70364:240 @694,1504 52x12 HORIZONTAL gap=8 pad=0,0,0,0
        ELLIPSE "Ellipse 28" 11:1269 @694,1504 12x12 stroke=#d28a4c/1.2999999523162842
        ELLIPSE "Ellipse 29" 11:1270 @714,1504 12x12 fill=#d28a4c
        ELLIPSE "Ellipse 30" 11:1271 @734,1504 12x12 stroke=#d28a4c/1.2999999523162842
```

## Mobile

```
FRAME "Mobile / Detalhes do NFT" 15:5536 @0,0 414x896 fill=#140d0a r=40 VERTICAL gap=-114 pad=0,0,0,0
  FRAME "Hero" 70396:241 @0,0 414x506
    RECTANGLE "Rectangle 6" 15:5559 @0,0 414x506 fill=GRADIENT_LINEAR
    GROUP "Group 62" 15:5657 @179,365 56x7 r=0,0,0,0
      ELLIPSE "Ellipse 2" 15:5653 @214,365 7x7 fill=#d28a4c
      ELLIPSE "Ellipse 3" 15:5654 @228,365 7x7 fill=#d28a4c
      RECTANGLE "Rectangle 98" 15:5656 @179,365 28x7 fill=#d28a4c r=25
    FRAME "Frame 427" 70410:4159 @28,23 361x399 VERTICAL gap=8 pad=0,0,0,0
      FRAME "Frame 426" 70410:4158 @28,23 361x35 HORIZONTAL gap=291 pad=0,0,0,0
        FRAME "Back" 15:5754 @28,23 35x35 VERTICAL gap=10 pad=0,0,0,0
          FRAME "Frame 424" 70410:4156 @28,23 35x35 fill=#2f1d15 stroke=#3f2319/1 r=17.5 HORIZONTAL gap=10 pad=8,8,8,8
            INSTANCE "Iconly/Curved/Arrow - Left 2" 15:5745 @36,31 20x20
              GROUP "Arrow - Left 2" I15:5745;29221:4975 @43,35 6x12
                VECTOR "Stroke 1" I15:5745;29221:4976 @43,35 6x12 stroke=#cfb28c/1.5
        FRAME "Heart" 15:5755 @354,23 35x35 VERTICAL gap=10 pad=0,0,0,0
          FRAME "Frame 57" 15:5640 @354,23 35x35 VERTICAL gap=10 pad=0,0,0,0
            FRAME "Frame 425" 70410:4157 @354,23 35x35 fill=#2f1d15 stroke=#3f2319/1 r=17.5 VERTICAL gap=10 pad=0,0,0,0
              VECTOR "Vector" 15:5642 @364,33 16x14 fill=#e89b55
      RECTANGLE "Mobile NFT Hero Artwork" 15:5639 @28,66 361x356 fill=IMG r=24
  FRAME "Details Sheet" 70396:242 @0,392 414x504 fill=#241612 r=31,31,0,0 VERTICAL gap=12 pad=32,24,24,24
    FRAME "Title Row" 70396:243 @24,424 366x27 HORIZONTAL gap=undefined pad=0,0,0,0
      TEXT "Emerald Ape #042" 15:5561 @24,430 193x16 fill=#f5f1eb [Roboto Mono 700 20/16 ls=0.00] "Emerald Ape #042"
      GROUP "Review" 15:5690 @307,424 83x27 r=0,0,0,0
        INSTANCE "Iconly/Bold/Star" 15:5663 @313,430 14x14
          GROUP "Star" I15:5663;11:1193 @314,431 12x11
            VECTOR "Star" I15:5663;11:1194 @314,431 12x11 fill=#e3a44e
        GROUP "Group 63" 15:5689 @307,424 83x27 r=32
          TEXT "(19)" 15:5662 @356,430 34x16 fill=#cfb28c [Roboto Mono 400 14/16 ls=0.00] "(19)"
          TEXT "4.8" 15:5687 @331,430 26x16 fill=#f5f1eb [Roboto Mono 500 14/16 ls=0.00] "4.8"
          RECTANGLE "Rectangle 99" 15:5688 @307,424 80x27 stroke=#d28a4c/1 r=32
    TEXT "Um colecionável digital 1/50 finalizado à mão da coleção Kurio Editions, verificado na Ethereum." 15:5668 @24,463 361x71 fill=#cfb28c [Roboto Mono 400 14/24 ls=0.00] "Um colecionável digital 1/50 finalizado à mão da coleção Kurio Editions, verificado na Eth"
    FRAME "Frame 66" 15:5761 @24,546 232x52 VERTICAL gap=8 pad=0,0,0,0
      TEXT "Edição:" 15:5660 @24,546 64x16 fill=#f5f1eb [Roboto Mono 700 15/16 ls=0.00] "Edição:"
      FRAME "Frame 432" 70410:4178 @24,570 232x28 HORIZONTAL gap=12 pad=0,0,0,0
        FRAME "Frame 428" 70410:4166 @24,570 42x28 HORIZONTAL gap=10 pad=0,0,0,0
          ELLIPSE "Ellipse 25" 15:5670 @24,570 42x28 stroke=#3f2319/1
          TEXT "1/10" 15:5674 @28,576 34x16 fill=#cfb28c [Roboto Mono 400 14/16 ls=0.00] "1/10"
        FRAME "Frame 431" 70410:4173 @78,570 42x28 HORIZONTAL gap=10 pad=0,0,0,0
          ELLIPSE "Ellipse 25" 70410:4174 @78,570 42x28 stroke=#3f2319/1
          TEXT "1/10" 70410:4175 @82,576 34x16 fill=#cfb28c [Roboto Mono 400 14/16 ls=0.00] "1/10"
        FRAME "Frame 429" 70410:4167 @132,570 46x28 HORIZONTAL gap=10 pad=0,0,0,0
          ELLIPSE "Ellipse 26" 15:5671 @132,570 46x28 stroke=#d28a4c/1
          TEXT "1/50" 15:5675 @138,576 34x16 fill=#e89b55 [Roboto Mono 500 14/16 ls=0.00] "1/50"
        FRAME "Frame 430" 70410:4168 @190,570 66x28 HORIZONTAL gap=10 pad=0,0,0,0
          ELLIPSE "Ellipse 27" 15:5672 @190,570 66x28 stroke=#3f2319/1
          TEXT "ABERTA" 15:5676 @198,576 51x16 fill=#cfb28c [Roboto Mono 400 14/16 ls=0.00] "ABERTA"
    FRAME "Token Info" 70396:244 @24,610 307x84 VERTICAL gap=12 pad=0,0,0,0
      TEXT "ID do token: #0042" 15:5693 @24,610 163x20 fill=#b39463 [Roboto Mono 400 15/20 ls=0.00] "ID do token: #0042"
      TEXT "Coleção: Kurio Apes" 15:5694 @24,642 172x20 fill=#b39463 [Roboto Mono 400 15/20 ls=0.00] "Coleção: Kurio Apes"
      TEXT "Atributos: Óculos, Esmeralda, Raro" 15:5695 @24,674 307x20 fill=#b39463 [Roboto Mono 400 15/20 ls=0.00] "Atributos: Óculos, Esmeralda, Raro"
  FRAME "Buy Bar" 70396:245 @0,732 414x164 fill=#241612 r=40,40,0,0 VERTICAL gap=10 pad=20,24,36,24 fx=[["DROP_SHADOW",20,{"x":0,"y":0},"#0a0604/0.45"]]
    FRAME "Frame 438" 70410:4214 @24,752 366x110 VERTICAL gap=20 pad=0,0,0,0
      FRAME "Frame 434" 70410:4210 @24,752 366x30 HORIZONTAL gap=142 pad=0,0,0,0
        FRAME "Frame 67" 16:355 @24,752 120x30 HORIZONTAL gap=8 pad=0,0,0,0
          TEXT "Qtd." 15:5759 @24,759 37x16 fill=#cfb28c [Roboto Mono 500 15/16 ls=0.00] "Qtd."
          FRAME "Frame 433" 70410:4179 @69,752 75x30 HORIZONTAL gap=12 pad=0,0,0,0
            FRAME "Add Button" 70410:4202 @69,752 20x30 fill=#d28a4c stroke=#140d0a/1 r=20 VERTICAL gap=undefined pad=0,0,0,0 fx=[["DROP_SHADOW",12,{"x":0,"y":4},"#140d0a/0.15"]]
              FRAME "Frame" 70410:4203 @71,759 16x16
                VECTOR "Vector" 70410:4204 @74,766 9x1 fill=#000000
            TEXT "1" 15:5720 @101,755 11x25 fill=#f5f1eb [Roboto Mono 500 18/25 ls=0.00] "1"
            FRAME "Add Button" 70410:4206 @124,752 20x30 fill=#d28a4c stroke=#140d0a/1 r=20 VERTICAL gap=undefined pad=0,0,0,0 fx=[["DROP_SHADOW",12,{"x":0,"y":4},"#140d0a/0.15"]]
              FRAME "Frame" 70410:4207 @126,759 16x16
                VECTOR "Vector" 70410:4208 @129,762 9x9 fill=#000000
        TEXT "1.19 ETH" 15:5562 @293,759 97x16 fill=#e89b55 [Roboto Mono 700 20/16 ls=0.00] "1.19 ETH"
      FRAME "Frame 437" 70410:4213 @24,802 268x60 HORIZONTAL gap=12 pad=0,0,0,0
        FRAME "Frame 435" 70410:4211 @24,802 196x60 fill=GRADIENT_LINEAR r=40 HORIZONTAL gap=10 pad=20,44,20,48
          TEXT "Comprar NFT" 15:5728 @71,822 106x20 fill=#140d0a [Roboto Mono 700 16/20 ls=0.00] "Comprar NFT"
        FRAME "Frame 436" 70410:4212 @232,802 60x60 fill=#2f1d15 stroke=#3f2319/1 r=40 HORIZONTAL gap=10 pad=20,20,20,20
          INSTANCE "Shop" 16:357 @252,822 20x20
            VECTOR "Vector" I16:357;15:5525 @253,824 18x17 fill=#b39463
```
