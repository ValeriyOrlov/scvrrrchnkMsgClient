import forge from 'node-forge';

// Генерирует пару ключей RSA
export async function generateRSAKeyPair(): Promise<{ publicKey: string; privateKey: string }> {
  return new Promise((resolve, reject) => {
    forge.pki.rsa.generateKeyPair({ bits: 2048, workers: -1 }, (err, keypair) => {
      if (err) reject(err);
      else {
        resolve({
          publicKey: forge.pki.publicKeyToPem(keypair.publicKey),
          privateKey: forge.pki.privateKeyToPem(keypair.privateKey),
        });
      }
    });
  });
}

// Экспорт приватного ключа в localStorage (можно зашифровать паролем позже)
export function savePrivateKey(userId: number, privateKey: string) {
  localStorage.setItem(`privateKey_${userId}`, privateKey);
}

// Получить приватный ключ
export function getPrivateKey(userId: number): string | null {
  return localStorage.getItem(`privateKey_${userId}`);
}

// Шифрование сообщения для одного получателя
export function encryptForRecipientAndSelf(
  plaintext: string,
  recipientPublicKeyPem: string,
  senderPublicKeyPem: string   // публичный ключ самого отправителя
) {
  const aesKey = forge.random.getBytesSync(32)
  const iv = forge.random.getBytesSync(16)

  // Шифруем текст
  const cipher = forge.cipher.createCipher('AES-GCM', aesKey)
  cipher.start({ iv: forge.util.createBuffer(iv) })
  cipher.update(forge.util.createBuffer(plaintext, 'utf8'))
  cipher.finish()

  const encryptedContent = forge.util.bytesToHex(cipher.output.getBytes())
  const authTag = forge.util.bytesToHex(cipher.mode.tag.getBytes())

  // Шифруем AES-ключ для получателя
  const recipientPubKey = forge.pki.publicKeyFromPem(recipientPublicKeyPem)
  const encryptedKeyRecipient = forge.util.bytesToHex(
    recipientPubKey.encrypt(aesKey, 'RSA-OAEP')
  )

  // Шифруем AES-ключ для себя (чтобы читать историю)
  const senderPubKey = forge.pki.publicKeyFromPem(senderPublicKeyPem)
  const encryptedKeySender = forge.util.bytesToHex(
    senderPubKey.encrypt(aesKey, 'RSA-OAEP')
  )

  return {
    encrypted_content: encryptedContent,
    encrypted_key_sender: encryptedKeySender,
    encrypted_key_recipient: encryptedKeyRecipient,
    iv: forge.util.bytesToHex(iv),
    auth_tag: authTag,
  }
}

export function decryptMessage(
  encryptedContent: string,
  encryptedKey: string,
  ivHex: string,
  authTagHex: string,
  privateKeyPem: string
): string | null {
  try {
    const privateKey = forge.pki.privateKeyFromPem(privateKeyPem)

    // 1. Расшифровываем AES-ключ
    const aesKey = privateKey.decrypt(
      forge.util.hexToBytes(encryptedKey),
      'RSA-OAEP'
    )

    // 2. Настраиваем расшифровку
    const decipher = forge.cipher.createDecipher('AES-GCM', aesKey)
    decipher.start({
      iv: forge.util.createBuffer(forge.util.hexToBytes(ivHex)),
      tag: forge.util.createBuffer(forge.util.hexToBytes(authTagHex)),
    })
    decipher.update(
      forge.util.createBuffer(forge.util.hexToBytes(encryptedContent))
    )
    decipher.finish()

    return decipher.output.toString()
  } catch (err) {
    console.error('Decryption failed', err)
    return null
  }
}