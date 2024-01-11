"use strict";

// RPC要求の送信データ作成
/**
 * Encode an RPC request for transmission.
 * @param {Uint8Array} appSignSecKey The secret key used to sign the request.
 * @param {string} requestId The unique ID of the request.
 * @param {string} method The name of the method to be invoked.
 * @param {Array} params The parameters to be passed to the method.
 * @returns {event} The encoded RPC request.
 */
async function encodeRpcRequest(appSignSecKey, toPubKeyHex, requestId, method, params) {
    // RPCの組み立て
    const rpc = { id: requestId, method: method, params: params };
    console.log(rpc);
    // JSON化
    const rpc_json = JSON.stringify(rpc);
    console.log(rpc_json);
    // nip-04暗号化
    const encrypted_rpc_json = await window.NostrTools.nip04.encrypt(appSignSecKey, toPubKeyHex, rpc_json);
    console.log(encrypted_rpc_json);
    // kind 24133組み立て
    const kind = {
        kind: 24133,
        created_at: Math.floor(Date.now() / 1000),
        tags: [
            ["p", toPubKeyHex]
        ],
        content: encrypted_rpc_json,
    };
    console.log(kind);
    // appSignSecKeyによる署名
    const event = window.NostrTools.finalizeEvent(kind, appSignSecKey)
    console.log(event);
    return event;
}

// RPC応答の送信データ作成
/**
 * Encode an RPC request for transmission.
 * @param {Uint8Array} appSignSecKey The secret key used to sign the request.
 * @param {string} requestId The unique ID of the request.
 * @param {string} method The name of the method to be invoked.
 * @param {Array} params The parameters to be passed to the method.
 * @returns {event} The encoded RPC request.
 */
async function encodeRpcResponse(appSignSecKey, toPubKeyHex, requestId, result, error) {
    // RPCの組み立て
    const rpc = { id: requestId, result: result, error: error };
    console.log(rpc);
    // JSON化
    const rpc_json = JSON.stringify(rpc);
    console.log(rpc_json);
    // nip-04暗号化
    const encrypted_rpc_json = await window.NostrTools.nip04.encrypt(appSignSecKey, toPubKeyHex, rpc_json);
    console.log(encrypted_rpc_json);
    // kind 24133組み立て
    const kind = {
        kind: 24133,
        created_at: Math.floor(Date.now() / 1000),
        tags: [
            ["p", toPubKeyHex]
        ],
        content: encrypted_rpc_json,
    };
    console.log(kind);
    // appSignSecKeyによる署名
    const event = window.NostrTools.finalizeEvent(kind, appSignSecKey)
    console.log(event);
    return event;
}

// RPC要求のパース
/**
 * Decode an RPC request.
 * @param {Uint8Array} appSignSecKey - The secret key used to sign the request.
 * @param {event} event - The encoded RPC request.
 * @returns {rpc} The decoded RPC request.
 */
async function decodeRpc(appSignSecKey, event) {
    // 署名検証
    if (!window.NostrTools.verifyEvent(event)) { throw "Bad event"; }
    console.log("Verify OK");

    // kind 24133解析
    if (event.kind !== 24133) { throw "Bad kind"; }
    const to = event.tags.find((e) => { return e[0] == "p" })
    const mypub = window.NostrTools.getPublicKey(appSignSecKey);
    console.log(to);
    if (to[1] != mypub) { throw "Bad pubkey (" + to[1] + " != " + mypub + ")"; }
    const content = event.content;
    console.log(content);

    // nip-04復号
    const decrypted_rpc_json = await window.NostrTools.nip04.decrypt(appSignSecKey, event.pubkey, content);
    console.log(decrypted_rpc_json);

    // JSONパース
    const rpc_json = JSON.parse(decrypted_rpc_json);
    console.log(rpc_json);

    // RPC解析
    rpc_json["pubkey"] = event.pubkey;
    return rpc_json;
}

