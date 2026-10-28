# Talitha – Auto Shorts

YouTube Shorts videosu bitince otomatik olarak bir sonrakine geçen basit bir Chrome eklentisi.

Ad, Büyük Ayı'daki Talitha yıldızından gelir ("ceylanın üçüncü sıçrayışı"). Eklentinin işi de bir videodan diğerine sıçramak.

## Özellikler

- Video bitmeden hemen önce "Sonraki video" düğmesine basar.
- Simgeye tıklayınca küçük bir pencere açılır, içindeki düğmeyle açılıp kapanır. Simgedeki rozet durumu gösterir: `ON` / `OFF`.
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

Yeni dil eklemek için `_locales/en/messages.json` dosyasını `_locales/<dil-kodu>/messages.json` olarak kopyalayıp metinleri çevirin.

## Test

Node.js 18 veya üstü gerekir, ek paket gerekmez.

```
node --test
```

21 test vardır. Kapsamları:
- Dil paketleri: her dilde aynı anahtarlar var, boş metin yok, manifest ve pencerede kullanılan her anahtarın karşılığı var, Chrome Web Store uzunluk sınırları aşılmıyor.
- Aktif videoyu seçme.
- Bitişi yakalama (bitmeden önce, `ended`, başa sarma).
- Kullanıcı videoyu geri sararsa geçmemesi.
- Geçişler arası bekleme süresi.
- Gerçek sayfada ölçülen döngü davranışının tekrar oynatılması (250 ms ve arka plan sekmesindeki 1 sn'lik zamanlayıcıyla).

Testler karar mantığını sınar. Chrome içinde eklentinin sayfaya yüklenmesini ve düğmeye tıklamasını sınamaz.

## Bilinen sınırlar

- Ana sayfadaki veya abonelikler sayfasındaki Shorts şeridinde çalışmaz, yalnızca `/shorts/` sayfasında çalışır.
- YouTube sayfa yapısını değiştirirse "Sonraki video" düğmesinin seçicisi (`#navigation-button-down button`) güncellenmelidir.
- Chrome Web Store'da yayınlanmış değildir, paketlenmemiş olarak yüklenir.
