#!/usr/bin/env python3
"""يعدّل .github/workflows/build-apk.yml (مرة واحدة) لإضافة التوقيع الثابت ومكوّن التحديث."""
import re, sys, pathlib
p = pathlib.Path('.github/workflows/build-apk.yml')
L = p.read_text(encoding='utf8').split('\n')
txt = '\n'.join(L)
if 'android-patch.py' in txt:
    print('workflow معدّل من قبل'); sys.exit(0)
i = next((k for k, l in enumerate(L) if 'cap add android' in l), None)
if i is None:
    print('خطأ: لم أجد خطوة cap add android'); sys.exit(1)
st = i
while st > 0 and not re.match(r'^\s*- ', L[st]): st -= 1
ind = re.match(r'^(\s*)- ', L[st]).group(1)
en = i + 1
while en < len(L) and not re.match(r'^' + ind + r'- ', L[en]) and not (L[en].strip() and not L[en].startswith(ind)): en += 1
tag = 'apk-latest'
for l in L:
    m = re.match(r'^\s*tag_name:\s*[\'"]?([^\'"\s]+)', l)
    if m: tag = m.group(1)
info = [ind + '- name: APK build info',
        ind + '  run: echo \'{"n":${{ github.run_number }},"repo":"${{ github.repository }}","tag":"%s"}\' > www/apk-build.json' % tag]
sign = [ind + '- name: Android signing + installer plugin',
        ind + '  env:',
        ind + '    KS_B64: ${{ secrets.KS_B64 }}',
        ind + '    KS_PASS: ${{ secrets.KS_PASS }}',
        ind + '  run: python3 tools/android-patch.py']
L = L[:st] + info + L[st:en] + sign + L[en:]
# رقم البناء في وصف الإصدار
done = False
for k, l in enumerate(L):
    m = re.match(r'^(\s*)body:', l)
    if m: L[k] = m.group(1) + 'body: build ${{ github.run_number }}'; done = True
if not done:
    for k, l in enumerate(L):
        m = re.match(r'^(\s*)tag_name:', l)
        if m: L.insert(k + 1, m.group(1) + 'body: build ${{ github.run_number }}'); done = True; break
p.write_text('\n'.join(L), encoding='utf8')
print('تم تعديل workflow | tag =', tag, '| body =', done)
