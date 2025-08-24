// backend/config/serpServices.js

const serpServices = {
  // 1. ScaleSERP
  'ScaleSERP': {
    baseURL: 'https://api.scaleserp.com/search',
    // تابعی برای تبدیل پارامترهای استاندارد ما به فرمت مورد نیاز این سرویس
    mapParams: (apiKey, keyword) => ({
      api_key: apiKey,
      q: keyword,
      location: 'Iran'
    })
  },

  // 2. SerpApi
  'SerpApi': {
    baseURL: 'https://serpapi.com/search',
    mapParams: (apiKey, keyword) => ({
      api_key: apiKey,
      q: keyword,
      gl: 'ir', // این سرویس از gl=ir برای ایران استفاده می‌کند
      hl: 'fa'
    })
  },

  // 3. Serpstack
  'Serpstack': {
    baseURL: 'http://api.serpstack.com/search', // توجه: برخی طرح‌های رایگان از http استفاده می‌کنند
    mapParams: (apiKey, keyword) => ({
      access_key: apiKey, // نام پارامتر کلید در این سرویس متفاوت است
      query: keyword,     // نام پارامتر کوئری نیز متفاوت است
      location: 'ir'
    })
  },

  // 4. SerpWow
  'SerpWow': {
    baseURL: 'https://api.serpwow.com/search',
    mapParams: (apiKey, keyword) => ({
      api_key: apiKey,
      q: keyword,
      location_code: 'ir' // نام پارامتر لوکیشن در این سرویس متفاوت است
    })
  },

  // 5. ValueSERP
  'ValueSERP': {
    baseURL: 'https://api.valueserp.com/search',
    mapParams: (apiKey, keyword) => ({
      api_key: apiKey,
      q: keyword,
      location: 'Iran'
    })
  },
  
  // 6. ZenSERP
  'ZenSERP': {
    baseURL: 'https://app.zenserp.com/api/v2/search',
    mapParams: (apiKey, keyword) => ({
      apikey: apiKey, // نام پارامتر کلید در این سرویس متفاوت است
      q: keyword,
      location: 'Iran'
    })
  }
};

module.exports = serpServices;