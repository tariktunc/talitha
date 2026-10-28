# Talitha – Auto Shorts

YouTube Shorts videosu bitince otomatik olarak bir sonrakine geçen basit bir Chrome eklentisi.

Ad, Büyük Ayı'daki Talitha yıldızından gelir ("ceylanın üçüncü sıçrayışı"). Eklentinin işi de bir videodan diğerine sıçramak.

## Özellikler

- Video bitmeden hemen önce "Sonraki video" düğmesine basar.
- Simgeye tıklayınca küçük bir pencere açılır, içindeki düğmeyle açılıp kapanır. Simgedeki rozet sekmeye göre değişir: YouTube sekmesinde yeşil `ON` (düğme açıksa), YouTube dışındaki sekmelerde gri `OFF`.
- Shorts sekmesi arka plandayken (başka sekmedeyken) kaydırma durur, sekmeye dönünce devam eder.
- Yalnızca `youtube.com/shorts/` adreslerinde çalışır.
- Dil desteği: İngilizce (varsayılan) ve Türkçe. Chrome'un arayüz diline göre otomatik seçilir.
- Hiçbir veri toplamaz, hiçbir sunucuya bağlanmaz. Tek izin: `storage` (açık/kapalı durumunu saklamak için).

## Kurulum

1. Bu repoyu indirin veya klonlayın.
2. Chrome'da `chrome://extensions` sayfasını açın.
3. "Geliştirici modu"nu açın.
4. "Paketlenmemiş öğe yükle"ye tıklayıp proje klasörünü seçin.
5. Bir Shorts videosu açın. Eklenti açıkken rozet `ON` gösterir. Kapatmak için simgeye tıklayıp düğmeyi çevirin.

## Nasıl çalışır

1. Her 250 ms'de adresin `/shorts/` ile başladığına bakar.
2. Ekranın ortasını kaplayan videoyu aktif video sayar.
3. YouTube videoyu döngüye alır ve bitince `ended` olayı vermeden başa sarar. Bu yüzden eklenti, bitmesine 0,35 saniye kala geçer. Başa sarmayı ve `ended` bayrağını yedek olarak izler.
4. Geçiş için "Sonraki video" düğmesine tıklar. Düğme bulunamazsa aşağı ok tuşunu gönderir.
5. Geçişler arasında 1,5 saniye bekler, aynı videoda iki kez geçmez.
6. Sekme görünür değilse hiç geçmez.

Rozet için `background.js`, sekmenin adresine bakar. Bu yüzden `manifest.json` içinde yalnızca `https://www.youtube.com/*` için ana makine izni vardır. Başka sitelerin adresini okuyamaz.

## Dosyalar

| Dosya | Görev |
|---|---|
| `manifest.json` | Eklenti tanımı (Manifest V3) |
| `logic.js` | Karar mantığı. DOM'a dokunmaz, Node'da test edilir |
| `content.js` | Sayfayı izler, videoyu bulur, düğmeye tıklar |
| `background.js` | `ON` / `OFF` rozeti |
| `popup.html` / `popup.css` / `popup.js` | Simgeye tıklayınca açılan aç/kapa penceresi |
| `_locales/en`, `_locales/tr` | Dil paketleri (ad, açıklama, pencere metinleri) |
| `icons/` | Logo (`icon.svg` ve PNG boyutları) |
| `test/logic.test.js` | Karar mantığı testleri |
| `test/locales.test.js` | Dil paketi testleri |
| `test/popup.test.js` | Pencere altındaki blakfy.com bağlantısı testi |
| `test/content.test.js` | `content.js`'i sahte sayfada çalıştırır (gizli sekme, `/shorts/` dışı, kapalı durum) |
| `test/icons.test.js` | Simge dosyaları testi |
| `e2e/extension.e2e.js` | Gerçek Chromium'da uçtan uca testler |

Yeni dil eklemek için `_locales/en/messages.json` dosyasını `_locales/<dil-kodu>/messages.json` olarak kopyalayıp metinleri çevirin.

## Test

Node.js 18 veya üstü gerekir, ek paket gerekmez.

```
node --test
```

35 test vardır. Kapsamları:
- Rozet kuralı: yalnızca `https://www.youtube.com/` ve düğme açıkken yeşil `ON`. Benzer görünen adresler (`www.youtube.com.evil.com`, `http://`) sayılmaz.
- Gizli sekmede kaydırma yok, sekmeye dönünce yanlış geçiş yok.
- Pencerenin altındaki "operated by Blakfy Studio" yazısı, güvenli şekilde yeni sekmede `https://blakfy.com` adresini açan bir bağlantı.
- Dil paketleri: her dilde aynı anahtarlar var, boş metin yok, manifest ve pencerede kullanılan her anahtarın karşılığı var, Chrome Web Store uzunluk sınırları aşılmıyor.
- Aktif videoyu seçme.
- Bitişi yakalama (bitmeden önce, `ended`, başa sarma).
- Kullanıcı videoyu geri sararsa geçmemesi.
- Geçişler arası bekleme süresi.
- Gerçek sayfada ölçülen döngü davranışının tekrar oynatılması (250 ms ve arka plan sekmesindeki 1 sn'lik zamanlayıcıyla).

### Uçtan uca test (gerçek tarayıcıda)

Eklentiyi gerçek bir Chromium'a yükleyip sürer. Playwright'ın Chromium'u ve internet gerekir.

```
npm install
npx playwright-core install chromium
npm run test:e2e
```

13 test vardır:
- Rozet sekmeyle birlikte değişiyor: YouTube dışında gri `OFF`, YouTube'da yeşil `ON`, sekme değişince ve sayfa YouTube'dan ayrılınca güncelleniyor (bu testler internetsiz, YouTube sahte sayfayla taklit edilir).
- Pencerenin altındaki "operated by Blakfy Studio" bağlantısına tıklayınca blakfy.com yeni sekmede açılıyor.
- Ad ve açıklama İngilizce ve Türkçe dil paketinden geliyor.
- Pencerede düğme açıp kapatınca depolama ve `ON` / `OFF` rozeti değişiyor, durum pencere kapanıp açılınca korunuyor.
- Gerçek YouTube Shorts'ta açıkken video bitince bir sonrakine geçiyor, kapalıyken geçmiyor.

Başsız Chromium sekmeleri gerçekten gizleyemediği için "arka plan sekmesinde kaymıyor" testi bu tarayıcıda atlanır. Bu kural birim testleriyle sınanır.

YouTube testleri internete bağlıdır. Shorts yüklenmezse test geçmiş sayılmaz, atlandı olarak raporlanır. Normal `npm test` yalnızca hızlı birim testlerini çalıştırır.

## Bilinen sınırlar

- Ana sayfadaki veya abonelikler sayfasındaki Shorts şeridinde çalışmaz, yalnızca `/shorts/` sayfasında çalışır.
- YouTube sayfa yapısını değiştirirse "Sonraki video" düğmesinin seçicisi (`#navigation-button-down button`) güncellenmelidir.
- Chrome Web Store'da yayınlanmış değildir, paketlenmemiş olarak yüklenir.
