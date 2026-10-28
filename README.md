# Talitha – YouTube Shorts Otomatik Kaydırıcı

YouTube Shorts videosu bitince otomatik olarak bir sonrakine geçen basit bir Chrome eklentisi.

Ad, Büyük Ayı'daki Talitha yıldızından gelir ("ceylanın üçüncü sıçrayışı"). Eklentinin işi de bir videodan diğerine sıçramak.

## Özellikler

- Video bitmeden hemen önce "Sonraki video" düğmesine basar.
- Simgeye tıklayınca açılır/kapanır. Rozet durumu gösterir: `ON` / `OFF`.
- Yalnızca `youtube.com/shorts/` adreslerinde çalışır.
- Hiçbir veri toplamaz, hiçbir sunucuya bağlanmaz. Tek izin: `storage` (açık/kapalı durumunu saklamak için).

## Kurulum

1. Bu repoyu indirin veya klonlayın.
2. Chrome'da `chrome://extensions` sayfasını açın.
3. "Geliştirici modu"nu açın.
4. "Paketlenmemiş öğe yükle"ye tıklayıp proje klasörünü seçin.
5. Bir Shorts videosu açın. Eklenti açıkken rozet `ON` gösterir.

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
| `background.js` | Simge tıklaması ve `ON` / `OFF` rozeti |
| `icons/` | Logo (`icon.svg` ve PNG boyutları) |
| `test/logic.test.js` | Birim testleri |

## Test

Node.js 18 veya üstü gerekir, ek paket gerekmez.

```
node --test test/logic.test.js
```

15 test vardır. Kapsamları:
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
