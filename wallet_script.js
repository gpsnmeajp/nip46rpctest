"use strict";

/*

function sendRpcClientToRemote(singer, signer-key-hex, request-id, method, params)
function sendRpcRemoteToClient(singer, signer-key-hex, request-id, result, error)

singer.pubkey
singer.sign
singer.nip04encrypt
singer.nip04decrypt

onRpcClientToRemote(client-key-hex, request-id, method, params)
onRpcRemoteToClient(signer-key-hex, request-id, result, error)


const relay = document.getElementById("nsecbunker_mode_relay_input").value;
document.getElementById("nsecbunker_mode_token_output");
document.getElementById("nsecbunker_mode_status_output");

const token = document.getElementById("started_by_the_client_mode_token_input").value;
document.getElementById("started_by_the_client_mode_status");
        
document.getElementById("nsecbunker_mode_start").addEventListener('click', async (e) => {});
document.getElementById("started_by_the_client_mode_read_qr").addEventListener('click', async (e) => {});
document.getElementById("started_by_the_client_mode_start").addEventListener('click', async (e) => {});

---
https://github.com/nbd-wtf/nostr-tools

window.NostrTools.finalizeEvent
window.NostrTools.Relay.connect

window.NostrTools.generateSecretKey
window.NostrTools.getPublicKey

window.NostrTools.nip19.nsecEncode
window.NostrTools.nip19.npubEncode
window.NostrTools.nip19.decode

*/
const appSignSecKey = window.NostrTools.generateSecretKey();
const appPubKey = window.NostrTools.getPublicKey(appSignSecKey);
let image = new Image();

function logBunkerStatus(s) {
    document.getElementById("nsecbunker_mode_status_output").innerText += (new Date().toLocaleString() + " " + s + "\n");
}
function logClientStatus(s) {
    document.getElementById("started_by_the_client_mode_status_output").innerText += (new Date().toLocaleString() + " " + s + "\n");
}

async function eventDispacher(event, relay, log) {
    const head = "【" + event.id.substring(0, 6) + "】";
    log(head + "event受信: " + JSON.stringify(event));
    log(head + "デコードを試みます...");
    try {
        const req = await decodeRpc(appSignSecKey, event);
        log(head + "デコード成功: " + JSON.stringify(req));

        if (req.method != undefined) {
            //要求
            if (req.method == "connect") {
                log(head + "[要求] connect");
                log(head + "[応答] ack");
                const res = await encodeRpcResponse(appSignSecKey, req.pubkey, req.id, "ack", "");
                log(head + "送信: " + JSON.stringify(res));
                relay.publish(res);
            }else if (req.method == "disconnect") {
                log(head + "[要求] disconnect");
                log(head + "[応答] ack");
                const res = await encodeRpcResponse(appSignSecKey, req.pubkey, req.id, "ack", "");
                log(head + "送信: " + JSON.stringify(res));
                relay.publish(res);
            } else if (req.method == "ping") {
                log(head + "[要求] ping");
                log(head + "[応答] pong");
                const res = await encodeRpcResponse(appSignSecKey, req.pubkey, req.id, "pong", "");
                log(head + "送信: " + JSON.stringify(res));
                relay.publish(res);
            } else if (req.method == "get_public_key") {
                log(head + "[要求] get_public_key");
                log(head + "[応答] pubkey-hex");
                try {
                    if (confirm(head + " get_public_key 許可しますか?")) {
                        const res = await encodeRpcResponse(appSignSecKey, req.pubkey, req.id, await window.nostr.getPublicKey(), "");
                        log(head + "[許可]送信: " + JSON.stringify(res));
                        relay.publish(res);
                    } else {
                        throw "user not allowed.";
                    }
                } catch (error) {
                    console.error(error);
                    const res = await encodeRpcResponse(appSignSecKey, req.pubkey, req.id, "", "interrupted");
                    log(head + "[拒否]送信: " + JSON.stringify(res));
                    relay.publish(res);
                }
            } else if (req.method == "sign_event") {
                log(head + "[要求] sign_event");
                log(head + "[応答] json_string(event_with_pubkey_id_and_signature)");

                let content = req.params[0];
                if (typeof content === "string" || content instanceof String) {
                    content = JSON.parse(req.params[0])
                }

                log(head + "内容: " + JSON.stringify(content));
                try {
                    if (confirm(head + " sign_event 許可しますか?\n\n"+JSON.stringify(content,null,3))) {
                        const res = await encodeRpcResponse(appSignSecKey, req.pubkey, req.id, JSON.stringify(await window.nostr.signEvent(content)), "");
                        log(head + "[許可]送信: " + JSON.stringify(res));
                        relay.publish(res);
                    } else {
                        throw "user not allowed.";
                    }
                } catch (error) {
                    console.error(error);
                    const res = await encodeRpcResponse(appSignSecKey, req.pubkey, req.id, "", "interrupted");
                    log(head + "[拒否]送信: " + JSON.stringify(res));
                    relay.publish(res);
                }
            } else if (req.method == "nip04_encrypt") {
                log(head + "[要求] nip04_encrypt");
                log(head + "[応答] nip04-ciphertext");
                log(head + "内容: " + req.params[0]);
                try {
                    if (confirm(head + " nip04_encrypt 許可しますか?\n\n"+req.params[0]+"\n"+req.params[1])) {
                        const res = await encodeRpcResponse(appSignSecKey, req.pubkey, req.id, JSON.stringify(await window.nostr.nip04.encrypt(req.params[0], req.params[1])), "");
                        log(head + "[許可]送信: " + JSON.stringify(res));
                        relay.publish(res);
                    } else {
                        throw "user not allowed.";
                    }
                } catch (error) {
                    console.error(error);
                    const res = await encodeRpcResponse(appSignSecKey, req.pubkey, req.id, "", "interrupted");
                    log(head + "[拒否]送信: " + JSON.stringify(res));
                    relay.publish(res);
                }
            } else if (req.method == "nip04_decrypt") {
                log(head + "[要求] nip04_decrypt");
                log(head + "[応答] plaintext");
                log(head + "内容: " + req.params[0]);
                try {
                    if (confirm(head + " nip04_decrypt 許可しますか?\n\n"+req.params[0]+"\n"+req.params[1])) {
                        const res = await encodeRpcResponse(appSignSecKey, req.pubkey, req.id, JSON.stringify(await window.nostr.nip04.decrypt(req.params[0], req.params[1])), "");
                        log(head + "送信: " + JSON.stringify(res));
                        relay.publish(res);
                    } else {
                        throw "user not allowed.";
                    }
                } catch (error) {
                    console.error(error);
                    const res = await encodeRpcResponse(appSignSecKey, req.pubkey, req.id, "", "interrupted");
                    log(head + "送信: " + JSON.stringify(res));
                    relay.publish(res);
                }
            } else {
                log(head + "不明な(未対応の)要求: " + req.method);
                const res = await encodeRpcResponse(appSignSecKey, req.pubkey, req.id, "", "unkwon method");
                log(head + "送信: " + JSON.stringify(res));
                relay.publish(res);
            }
        }
        if(req.result != undefined) {
            //成功応答
            log(head + "[成功応答] "+req.result);
        }
        if(req.error != undefined) {
            //失敗応答
            log(head + "[失敗応答] "+req.error);
        }
    } catch (error) {
        log(head + "デコード失敗: " + error);
    }
    console.log(event);
}

window.addEventListener("load", async (event) => {
    document.getElementById("nsecbunker_mode_start").addEventListener('click', async (e) => {
        console.log("nsecbunker_mode_start");

        if (window.nostr == null) {
            logBunkerStatus("⚠ NIP-07が使用できません。");
        }

        // nsecbunkerとして接続を待ち受けるため、rcp relayに接続し待機
        const relay_adr = document.getElementById("nsecbunker_mode_relay_input").value;
        logBunkerStatus("relayに接続開始: " + relay_adr);
        let relay = await window.NostrTools.Relay.connect(relay_adr);
        logBunkerStatus("relayに接続完了");

        // appPubKeyをTokenとして表示
        document.getElementById("nsecbunker_mode_token_output").innerText = "この一時トークンでログインしてください: " + window.NostrTools.nip19.npubEncode(appPubKey);
        logBunkerStatus("トークンを表示しました");

        // イベント受信時にデコード
        let sub = relay.subscribe([
            {
                kinds: [24133],
                limit: 0,
                "#p": [appPubKey],
            }
        ], {
            async onevent(event) {
                await eventDispacher(event, relay, logBunkerStatus);
            },
            oneose() { }
        });
        logBunkerStatus("subscribe開始");

        // connect → confirm出して問題なければAck
        // get_public_key, sign_event, nip04_encrypt, nip04_decrypt → NIP-07に丸投げ
        // ping → pong

    });

    document.getElementById("started_by_the_client_mode_read_qr").addEventListener('change', async (e) => {
        console.log("started_by_the_client_mode_read_qr");
        let file = e.target.files[0];
        let reader = new FileReader();
        reader.readAsDataURL(file);

        reader.onload = () => {
            image.src = reader.result;
        }
        image.onload = () => {
            var cv = document.createElement('canvas');
            cv.width = image.naturalWidth;
            cv.height = image.naturalHeight;

            var ct = cv.getContext('2d');

            ct.imageSmoothingEnabled = false;
            ct.drawImage(image, 0, 0);

            var data = ct.getImageData(0, 0, cv.width, cv.height);
            const code = jsQR(data.data, cv.width, cv.height);
            if (code) {
                console.log("Found QR code", code);
                document.getElementById("started_by_the_client_mode_token_input").value = code.data;
            }
        }
    });
    document.getElementById("started_by_the_client_mode_start").addEventListener('click', async (e) => {
        console.log("started_by_the_client_mode_start");
        logClientStatus("npub:" + appPubKey);

        if (window.nostr == null) {
            logClientStatus("⚠ NIP-07が使用できません。");
        }
        const nostrconnect = document.getElementById("started_by_the_client_mode_token_input").value;
        logClientStatus("トークン:" + nostrconnect);

        // URLオブジェクトを作成
        const url = new URL(nostrconnect);

        // URLSearchParamsオブジェクトを使用してパラメータを取得
        const metadata = url.searchParams.get("metadata");
        const relay_adr = url.searchParams.get("relay");

        // Client Key HexはURLのpathname部分から取得
        const clientKeyHex = url.pathname.substring(2); // 先頭の/を取り除く

        logClientStatus(`Client Key Hex: ${clientKeyHex}`);
        logClientStatus(`Relay: ${relay_adr}`);
        logClientStatus(`Metadata: ${metadata}`);

        logClientStatus("relayに接続開始: " + relay_adr);
        let relay = await window.NostrTools.Relay.connect(relay_adr);
        logClientStatus("relayに接続完了");

        // イベント受信時にデコード
        let sub = relay.subscribe([
            {
                kinds: [24133],
                limit: 0,
                "#p": [appPubKey],
            }
        ], {
            async onevent(event) {
                await eventDispacher(event, relay, logClientStatus);
            },
            oneose() { }
        });
        logClientStatus("subscribe開始");

        // 接続要求を投げる
        const req = await encodeRpcRequest(appSignSecKey, clientKeyHex, "connect" + (new Date().getTime()), "connect", [appPubKey]);
        logClientStatus("【connect】送信: " + JSON.stringify(req));
        relay.publish(req);
    });
});