const express = require('express');
const bodyParser = require('body-parser');
const fetch = require('node-fetch');
const OpenAI = require('openai');
const config = require('./config');
require('dotenv').config();
const openai = new OpenAI({
    apiKey: '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',
    endpoint: 'https://api.openai.com'
});

const app = express();
app.use(bodyParser.json());// Middleware
// Serve static files from the 'public' directory
app.use(express.static('public'));
app.get('/', function (req, res) {
    res.send('Bot sedang berjalan');
});
// Example: Fetching chats from external API
app.get('/api/chats', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const pageSize = parseInt(req.query.pageSize) || 10; // Default to 10 items per page
    try {
        // Adjust this URL according to the API you are using. This is just an example
        const response = await fetch(`https://gate.whapi.cloud/chats?count=${pageSize}`, {
            headers: { 'Authorization': 'Bearer ' + config.token }
        });
        const data = await response.json();
        console.log(data);
        res.json(data);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});
app.post('/api/messages/text', async (req, res) => {
    const { chatId, message } = req.body;
    try {
        const response = await fetch(`https://gate.whapi.cloud/messages/text`, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + config.token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ to:chatId,body: message })
        });
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});
// Example: Fetching messages for a specific chat ID
app.get('/api/messages/:chatId', async (req, res) => {
    const chatId = req.params.chatId;
    try {
        const response = await fetch(`https://gate.whapi.cloud/messages/list/${chatId}?count=500`, {
            headers: { 'Authorization':  'Bearer '+config.token } // Replace YOUR_API_TOKEN_HERE with your actual token
        });
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
});
app.post('/hook/messages', handleNewMessages);

const port = process.env.PORT;
app.listen(port, function () {
    console.log(`Mendengar pada port ${port}...`);
});
// Tentukan langkah-langkah aliran kerja
const steps = {
    START: 'mula',
    WEBSTART:'webstart',
    STEP_ONE: 'langkah_satu',
    STEP_TWO: 'langkah_dua',
    STEP_THREE: 'langkah_tiga',
    STEP_FOUR: 'langkah_empat',
    FINISH: 'siap'
};

// Simpan keadaan pengguna (langkah semasa)
const userState = new Map();

// Set to keep track of sent messages once per person
const sentMessages = new Set();

// Function to fetch product information from Shopify API
async function fetchCollectionInformation(collectionId) {
    try {
        const shopifyStoreName = 'madreshoes';
        const version = '2024-01'; // Shopify API version
        const apiKey = '600c991da3a2e2393a3dcc1520e1c947'; // Replace with your Shopify API key
        const password = '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'; // Replace with your Shopify API password
        const collectionEndpoint = `https://${shopifyStoreName}.myshopify.com/admin/api/${version}/collections/${collectionId}/products.json`;

        const response = await fetch(collectionEndpoint, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Shopify-Access-Token': `${password}`
            }
        });
console.log(response.body);
        if (!response.ok) {
            const errorResponse = await response.text();
            throw new Error(`Failed to fetch products from collection ${collectionId}: ${errorResponse}`);
        }

        const data = await response.json();

        const productsWithPrices = [];
        
        for (const product of data.products) {
            const variantsResponse = await fetchVariants(product.id, version, apiKey, password);
            const variantsData = await variantsResponse.json();
            const price = variantsData.variants.length > 0 ? variantsData.variants[0].price : 'No price available';
            const imageUrl = product.image ? product.image.src : null;
            productsWithPrices.push({ ...product, price, imageUrl });
        }

        return productsWithPrices;


    } catch (error) {
        console.error('Error fetching collection products:', error);
        return null;
    }
}
async function fetchVariants(productId, version, apiKey, password) {
    const shopifyStoreName = 'madreshoes';
    const variantsEndpoint = `https://${shopifyStoreName}.myshopify.com/admin/api/${version}/products/${productId}/variants.json`;
    return fetch(variantsEndpoint, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': `${password}`
        }
    });
}
async function sendImage(recipient, imagePath) {
    // Read the image file and encode it in base64
    const paymentImage = fs.readFileSync(imagePath, { encoding: 'base64' });

    // Send the image
    await sendWhapiRequest('messages/image', { to: recipient, media: paymentImage });
}
let hasProcessed = false;
const fs = require('fs');
async function handleNewMessages(req, res) {
    const MADRE_AGENT_ID = '';
    const collectionId = '425848275187';
    const collectionId2 = '174120992811';
            // Fetch product information
            const products = await fetchCollectionInformation(collectionId);
            const all_products = await fetchCollectionInformation(collectionId2);
    try {
   
        const receivedMessages = req.body.messages;
        console.log('Menangani mesej-mesej baru...',receivedMessages);
        for (const message of receivedMessages) {

            const sender = {
                to: message.chat_id,
                name: message.from_name
            };
            if (message.from_me) break;
            if(!message.chat_id.includes("whatsapp")){
                break;
            }
            // Dapatkan langkah semasa atau tetapkan ke MULA jika tidak ditakrifkan
            let currentStep = userState.get(sender.to) || steps.WEBSTART;
            
            switch (currentStep) {
                case steps.WEBSTART:
        // 5 sec delay



        // Call webhook and log response
        const webhookResponse2 = await callWebhook('https://hook.us1.make.com/e6rlgyftqf3kebexbomwj3pqaukwytg9', message.text.body, sender.to, sender.name,products,all_products);
        console.log(webhookResponse2);

        if (webhookResponse2 === 'stop' || webhookResponse2 === 'Accepted') {
            break;
        }

        if (webhookResponse2) {
            // Send the response from the webhook to the user
            await sendWhapiRequest('messages/text', { to: sender.to, body: webhookResponse2 });

            // Helper function to process products array
            async function processProductsArray(productsArray) {
                for (const product of productsArray) {
                    if (webhookResponse2.toLowerCase().includes(product.title.toLowerCase())) {
                        // Construct the response string
                        let productResponse = `${product.title}: ${product.price}`;
                        console.log('Product Response:', productResponse);

                        // Send product image if imageUrl is available
                        if (product.imageUrl) {
                            await sendWhapiRequest('messages/image', { to: sender.to, media: product.imageUrl });
                            hasProcessed = true;
                            break; // Stop after finding the first matching product, remove if you want to process all matches
                        }
                    }
                }
            }

            if (!hasProcessed) {
               
         // Process both products and all_products
 if (products && Array.isArray(products) &&  products.length > 0) {
    await processProductsArray(products);
}
if (all_products  && Array.isArray(all_products) &&  all_products.length > 0) {
    await processProductsArray(all_products);
}
                // Set the flag to true after processing
             
            }
        
            if (message.text.body.includes('bayar') || message.text.body.includes('payment')) 
            {
                await sendWhapiRequest('messages/text', { to: sender.to, body: 'Nak buat pembayaran guna QRPay atau Online transfer?' });
            }

                    if (message.text.body.includes('qrpay') || message.text.body.includes('qr'))
                    {
                        // Read the image file and encode it in base64
                        const imagePath = 'https://firebasestorage.googleapis.com/v0/b/onboarding-a5fcb.appspot.com/o/WhatsApp%20Image%202024-03-25%20at%2007.08.50_4dffb874.jpg?alt=media&token=0ae1e773-2dac-4171-a51c-8171f71630a9';
                
                         // Send the image
                        const response = await sendWhapiRequest('messages/image', { to: sender.to, media: imagePath });
                        await sendWhapiRequest('messages/text', { to: sender.to, body: 'Ini adalah QR code kami boleh buat pembayaran sini ya' });
                        console.log('Image sent:', response);
                    }
                    else if (message.text.body.includes('online') || message.text.body.includes('on9'))
                    {
                        await sendWhapiRequest('messages/text', { to: sender.to, body: 'Kindly make your payment/transfer to:\n'+'568603023082\n'+'Madre Sdn Bhd\n'+'MAYBANK'});
                    }
                
        } else {
            // console.error('No valid response from webhook.');
        }

        console.log('Response sent.');
        if (message.text.body.includes("checkout")) {
            userState.set(sender.to, steps.START); // Update user state
        }

        break;
                    case steps.START:
                        // Menangani langkah satu
                        await sendWhapiRequest('messages/text', { to: sender.to, body: 'Saya pembantu AI dari MADRE untuk menjadikan pengalaman membeli-belah anda lebih baik.' });
                        await sendWhapiRequest('messages/text', { to: sender.to, body: 'Nampaknya anda membiarkan beberapa item didalam troli anda baru-baru ini:'});
                    const pollParams = {
                        to: sender.to,
                        title: 'Adakah anda ingin meneruskan pembelian untuk item-item ini?',
                        options: ['Ya', 'Tidak'],
                        count: 1,
                        view_once: true
                    };
                    webhook = await sendWhapiRequest('/messages/poll', pollParams);
                    console.log('result',webhook.message.poll.results);
                    userState.set(sender.to, steps.STEP_TWO); // Kemaskini keadaan pengguna
                    break;
                    
                    case steps.STEP_TWO:
                        
                        let selectedOption = [];
                        for (const result of webhook.message.poll.results) {
                            selectedOption.push (result.id);
                        }
                        
                        if(message.action.votes[0]=== selectedOption[0])
                        {
                            await sendWhapiRequest('messages/text', { to: sender.to, body: 'Klik di sini untuk selesaikan pembelian anda:\n' + 
                            'https://madre.my/collections/bestsellers'});
                            await sendWhapiRequest('messages/text', { to: sender.to, body: 'Ada perkara lain yang boleh saya bantu?' });
                            userState.set(sender.to, steps.FINISH); // Kemaskini keadaan pengguna
                            break;
                        }
                        if(message.action.votes[0]===selectedOption[1])
                        {
                            setTimeout(async () =>
                            {
                                await sendWhapiRequest('messages/text', { to: sender.to, body: 'Jualan murah untuk item anda!!\n' +
                                'Adakah anda ingin mendapatkan diskaun pada pesanan anda?'});
                                await sendWhapiRequest('messages/text', { to: sender.to, body: 'Selesaikan pembelian anda dalam masa satu jam dan dapatkan 10% diskaun!' });
                                const pollParams = {
                                    to: sender.to,
                                    title: 'Adakah anda ingin meneruskan pembelian untuk item-item ini?',
                                    options: ['Ya', 'Tidak'],
                                    count: 1,
                                    view_once: true
                                };
                                webhook = await sendWhapiRequest('/messages/poll', pollParams);
                                console.log('result',webhook.message.poll.results);
                                userState.set(sender.to, steps.STEP_THREE); // Kemaskini keadaan pengguna
                            },5 * 1000); //timer 5 saat
                            
                        break;
                        }
                        
                        case steps.STEP_THREE:

                        let selected_Option = [];
                        for (const result of webhook.message.poll.results) 
                        {
                            selected_Option.push (result.id);
                        }
                        if(message.action.votes[0]=== selected_Option[0])
                        {
                            await sendWhapiRequest('messages/text', { to: sender.to, body: 'Gembira mendengarnya!' });
                            await sendWhapiRequest('messages/text', { to: sender.to, body: 'Jangan biarkan kasut itu terlepas! Selesaikan pembelian anda sekarang dan nikmati diskaun istimewa 10%. Gunakan kod CART10 semasa pembayaran.'});
                            await sendWhapiRequest('messages/text', { to: sender.to, body: 'Klik di sini untuk selesaikan pembelian anda:\n' + 
                            'https://madre.my/collections/bestsellers'});
                            userState.set(sender.to, steps.FINISH); // Kemaskini keadaan pengguna
                        break;
                        }
                        if(message.action.votes[0]=== selected_Option[1])
                        {
                            setTimeout(async () =>
                            {
                                await sendWhapiRequest('messages/text', { to: sender.to, body: 'Hi, saya perasan anda tidak selesaikan pembelian anda\n' +
                                'Boleh tau sebab apa?\n' +
                                'Anda boleh memilih dari pilihan di bawah'});
                                const pollParams = {
                                  to: sender.to,
                                  title: 'Sila pilih',
                                  options: ['Ubah fikiran saya', 'Belum bersedia untuk membeli', 'Kerisauan Harga'],
                                  count: 1,
                                  view_once: true
                                };
                                webhook = await sendWhapiRequest('/messages/poll', pollParams);
                                console.log('result',webhook.message.poll.results);
                                userState.set(sender.to, steps.STEP_FOUR); // Kemaskini keadaan pengguna
                            },5* 1000);
                            break;
                        }

                        case steps.STEP_FOUR:
                            setTimeout(async () =>
                            {
                                await sendWhapiRequest('messages/text', { to: sender.to, body: 'Peluang terakhir! Kasut anda sedang menunggu didalam troli, tetapi kasut tersebut tidak akan berada di situ selamanya.\n' +
                                'Selesaikan pembelian anda sekarang dan terus bergaya!'});
                                await sendWhapiRequest('messages/text', { to: sender.to, body: 'Klik di sini untuk selesaikan pembelian anda:\n' + 
                                'https://madre.my/collections/bestsellers'});
                                userState.set(sender.to, steps.FINISH); // Kemaskini keadaan pengguna
                            },5*1000);
                            
                        break;
                        case steps.FINISH:
                                
                const webhookResponse = await callWebhook('https://hook.us1.make.com/e6rlgyftqf3kebexbomwj3pqaukwytg9',message.text.body,sender.to,sender.name);
                
                if (webhookResponse) {
                    // Send the response from the webhook to the user
                    await sendWhapiRequest('messages/text', { to: sender.to, body: webhookResponse });
                } else {
                    console.error('No valid response from webhook.');
                }
                break;
                default:
                    // Menangani langkah yang tidak dikenali
                    console.error('Langkah yang tidak dikenali:', currentStep);
                    break;
            }
        }

        res.send('Semua mesej diproses');
    } catch (e) {
        console.error('Ralat:', e.message);
        res.status(500).send('Ralat Server Dalaman');
    }
}
async function callWebhook(webhook,senderText,senderNumber,senderName,products,products2) {
   
    const webhookUrl = webhook;
    console.log('Memanggil webhook...'+webhookUrl);
    const body = JSON.stringify({ senderText,senderNumber,senderName, products,products2 }); 
    // Termasuk teks pengirim dalam badan permintaan
    
    const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: body
    });
    console.log(response.body);
    let responseData =""
    if(response.status === 200){
        responseData= await response.text(); // Dapatkan respons sebagai teks
    }else{
        responseData = 'stop'
    }
    console.log('Respon webhook:', responseData); // Log respon mentah
 return responseData;
}

async function sendWhapiRequest(endpoint, params = {}, method = 'POST') {
    console.log('Menghantar permintaan ke Whapi.Cloud...');
    const options = {
        method: method,
        headers: {
            Authorization: `Bearer ${config.token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
    };
    const url = `${config.apiUrl}/${endpoint}`;
    const response = await fetch(url, options);
    const jsonResponse = await response.json();
    console.log('Respon Whapi:', JSON.stringify(jsonResponse, null, 2));
    return jsonResponse;
}