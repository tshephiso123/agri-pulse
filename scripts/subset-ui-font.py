import sys, json, os
from pathlib import Path
if os.environ.get('AGRIPULSE_FONTTOOLS_PATH'):
    sys.path.insert(0, os.environ['AGRIPULSE_FONTTOOLS_PATH'])
from fontTools.ttLib import TTFont
from fontTools import subset
font=TTFont(sys.argv[1] if len(sys.argv)>1 else 'public/fonts/NotoSans.ttf')
options=subset.Options()
options.flavor='woff2'
subsetter=subset.Subsetter(options=options)
subsetter.populate(unicodes=list(range(0x250))+list(range(0x1e00,0x1f00))+list(range(0x2000,0x2070))+[0x2190,0x2192,0x20ac,0x223c,0xff5e])
subsetter.subset(font)
font.flavor='woff2'
font.save('public/fonts/NotoSans-latin.woff2')
check=TTFont('public/fonts/NotoSans-latin.woff2')
cmap=check.getBestCmap()
chars='ḓḽṅṋṱḒḼṄṊṰ'
assert all(ord(char) in cmap for char in chars)
# All assigned source glyphs in the requested range survive subsetting.
source=TTFont(sys.argv[1] if len(sys.argv)>1 else 'public/fonts/NotoSans.ttf').getBestCmap()
assert all(code in cmap for code in source if 0x1e00<=code<=0x1eff)
report={'family':'Noto Sans','variable_axes':[axis.axisTag for axis in check['fvar'].axes], 'size_bytes':Path('public/fonts/NotoSans-latin.woff2').stat().st_size, 'range':'U+1E00–U+1EFF: all source glyphs retained', 'required_glyphs':{char: {'unicode':f'U+{ord(char):04X}', 'glyph':cmap[ord(char)]} for char in chars}, 'source':'https://github.com/google/fonts/tree/main/ofl/notosans', 'public_sans_rejected':'Public Sans lacks 8 of the 10 requested Tshivenda characters.'}
Path('docs/ui/font-verification.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps(report,ensure_ascii=True,indent=2))
