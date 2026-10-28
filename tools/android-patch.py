#!/usr/bin/env python3
"""يُشغَّل داخل GitHub Actions بعد `cap add android`:
   توقيع ثابت للـ APK + إضافة مكوّن تثبيت التحديثات + رقم إصدار متزايد."""
import os, re, json, base64, pathlib, sys
root = pathlib.Path('.')
cfg = json.load(open('capacitor.config.json', encoding='utf8'))
pkg = cfg['appId']
app = root / 'android' / 'app'

# 1) المفتاح
ks_b64 = os.environ.get('KS_B64', '').strip()
signed = False
if ks_b64:
    ks = root / 'android' / 'qisas.keystore'
    ks.write_bytes(base64.b64decode(ks_b64))
    gp = app / 'build.gradle'
    g = gp.read_text(encoding='utf8')
    if 'QISAS_SIGN' not in g:
        block = ("android {\n    // QISAS_SIGN\n    signingConfigs {\n        debug {\n"
                 "            storeFile file('%s')\n            storePassword '%s'\n"
                 "            keyAlias 'qisas'\n            keyPassword '%s'\n        }\n    }\n") % (str(ks.resolve()).replace('\\', '/'), os.environ['KS_PASS'], os.environ['KS_PASS'])
        g = g.replace('android {\n', block, 1)
    run = os.environ.get('GITHUB_RUN_NUMBER', '1')
    g = re.sub(r'versionCode\s+\d+', 'versionCode ' + run, g, count=1)
    gp.write_text(g, encoding='utf8')
    signed = True
else:
    print('تنبيه: لا يوجد KS_B64 — سيُبنى بمفتاح عشوائي ولن يعمل التحديث من داخل التطبيق')

# 2) صلاحية التثبيت
mp = app / 'src' / 'main' / 'AndroidManifest.xml'
m = mp.read_text(encoding='utf8')
if 'REQUEST_INSTALL_PACKAGES' not in m:
    m = m.replace('<application', '<uses-permission android:name="android.permission.REQUEST_INSTALL_PACKAGES" />\n    <application', 1)
    mp.write_text(m, encoding='utf8')

# 3) المكوّن
jdir = app / 'src' / 'main' / 'java' / pathlib.Path(*pkg.split('.'))
jdir.mkdir(parents=True, exist_ok=True)
src = pathlib.Path('tools/ApkInstallerPlugin.java').read_text(encoding='utf8').replace('__PKG__', pkg)
(jdir / 'ApkInstallerPlugin.java').write_text(src, encoding='utf8')
ma = jdir / 'MainActivity.java'
t = ma.read_text(encoding='utf8')
if 'ApkInstallerPlugin' not in t:
    new = re.sub(r'public class MainActivity extends BridgeActivity\s*\{\s*\}',
        'public class MainActivity extends BridgeActivity {\n    @Override\n    public void onCreate(android.os.Bundle savedInstanceState) {\n        registerPlugin(ApkInstallerPlugin.class);\n        super.onCreate(savedInstanceState);\n    }\n}', t)
    if new == t:
        print('خطأ: لم أستطع تعديل MainActivity'); print(t); sys.exit(1)
    ma.write_text(new, encoding='utf8')
print('تم: توقيع=%s، حزمة=%s' % (signed, pkg))

# 4) مسارات FileProvider (لتثبيت الـ APK من مجلد الكاش)
fp = app / 'src' / 'main' / 'res' / 'xml' / 'file_paths.xml'
fp.parent.mkdir(parents=True, exist_ok=True)
fp.write_text('<?xml version="1.0" encoding="utf-8"?>\n<paths xmlns:android="http://schemas.android.com/apk/res/android">\n'
              '    <external-path name="my_images" path="." />\n    <cache-path name="my_cache_images" path="." />\n'
              '    <files-path name="my_files" path="." />\n</paths>\n', encoding='utf8')

# 5) ألوان الإقلاع: نمنع ظهور شاشة خضراء قبل تحميل الواجهة (آمنة: لا تكسر البناء عند الفشل)
try:
    BG = '#0e1512'
    res = app / 'src' / 'main' / 'res'
    (res / 'values').mkdir(parents=True, exist_ok=True)
    (res / 'values' / 'qisas_colors.xml').write_text('<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="qisas_bg">%s</color>\n</resources>\n' % BG, encoding='utf8')
    sp = res / 'values' / 'styles.xml'
    if sp.exists():
        s = sp.read_text(encoding='utf8')
        s = s.replace('@drawable/splash', '@color/qisas_bg')
        m = re.search(r'<style name="AppTheme\.NoActionBarLaunch"[^>]*parent="Theme\.SplashScreen"[^>]*>', s)
        if m and 'windowSplashScreenBackground' not in s:
            s = s[:m.end()] + '\n        <item name="windowSplashScreenBackground">@color/qisas_bg</item>' + s[m.end():]
        sp.write_text(s, encoding='utf8')
    print('تم ضبط لون الإقلاع', BG)
except Exception as e:
    print('تنبيه: تعذّر ضبط لون الإقلاع:', e)
