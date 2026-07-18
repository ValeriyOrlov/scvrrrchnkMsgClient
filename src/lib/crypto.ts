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
// генерация случайного Room Key (256 бит)
export function generateRoomKey(): string {
  return forge.util.bytesToHex(forge.random.getBytesSync(32))
}

// Шифрование Room Key для участника
export function encryptRoomKey(roomKey: string, publicKeyPem: string): string {
  try {
    const publicKey = forge.pki.publicKeyFromPem(publicKeyPem.trim()) // убираем лишние пробелы
    return forge.util.bytesToHex(publicKey.encrypt(forge.util.hexToBytes(roomKey), 'RSA-OAEP'))
  } catch (e) {
    console.error('encryptRoomKey failed:', e)
    throw new Error('Invalid public key format')
  }
}

// Расшифровка Room Key приватным ключом
export function decryptRoomKey(encryptedKey: string, privateKeyPem: string): string {
  try {
    const privateKey = forge.pki.privateKeyFromPem(privateKeyPem.trim())
    return forge.util.bytesToHex(privateKey.decrypt(forge.util.hexToBytes(encryptedKey), 'RSA-OAEP'))
  } catch (e) {
    console.error('decryptRoomKey failed:', e)
    throw e
  }
}

/**
 * Универсальная функция шифрования сообщения.
 * Для личного чата использует индивидуальные RSA-ключи получателя и отправителя,
 * для группового чата – симметричный Room Key (AES-GCM).
 *
 * @param plaintext - открытый текст сообщения
 * @param chatType - тип чата ('private' или 'group')
 * @param chatKeys - публичные ключи участников (для личного чата)
 * @param currentUserId - ID текущего пользователя
 * @param roomKey - расшифрованный Room Key (только для групповых чатов)
 * @returns объект с зашифрованными полями, готовый для отправки на сервер
 */

export function encryptMessage(
  plaintext: string,
  chatType: string,
  chatKeys: Record<number, string>,
  currentUserId: number,
  roomKey?: string | null
): {
  content: string
  encrypted_content: string
  encrypted_key_sender?: string
  encrypted_key_recipient?: string
  iv: string
  auth_tag: string
} {
  // Групповой чат: используем Room Key
  if (chatType === 'group' && roomKey) {
    const iv = forge.random.getBytesSync(16)
    const cipher = forge.cipher.createCipher('AES-GCM', forge.util.hexToBytes(roomKey))
    cipher.start({ iv: forge.util.createBuffer(iv) })
    cipher.update(forge.util.createBuffer(plaintext, 'utf8'))
    cipher.finish()

    return {
      content: '', // открытый текст не храним на сервере
      encrypted_content: forge.util.bytesToHex(cipher.output.getBytes()),
      iv: forge.util.bytesToHex(iv),
      auth_tag: forge.util.bytesToHex(cipher.mode.tag.getBytes()),
    }
  }

  // Личный чат: используем RSA-ключи
  if (chatType === 'private') {
    const myPublicKey = chatKeys[currentUserId]
    const otherKeys = Object.entries(chatKeys).filter(([uid]) => uid !== currentUserId.toString())

    if (!myPublicKey || otherKeys.length === 0) {
      // Нет ключей – возвращаем открытый текст (нешифрованное сообщение)
      return {
        content: plaintext,
        encrypted_content: '',
        iv: '',
        auth_tag: '',
      }
    }

    const recipientPublicKey = otherKeys[0][1]
    const encrypted = encryptForRecipientAndSelf(plaintext, recipientPublicKey, myPublicKey)

    return {
      content: '', // открытый текст не сохраняем на сервере
      encrypted_content: encrypted.encrypted_content,
      encrypted_key_sender: encrypted.encrypted_key_sender,
      encrypted_key_recipient: encrypted.encrypted_key_recipient,
      iv: encrypted.iv,
      auth_tag: encrypted.auth_tag,
    }
  }

  // На всякий случай – незашифрованное сообщение
  return {
    content: plaintext,
    encrypted_content: '',
    iv: '',
    auth_tag: '',
  }
}

export function encryptWithRoomKey(plaintext: string, roomKeyHex: string): { encrypted_content: string; iv: string; auth_tag: string } {
  const roomKey = forge.util.hexToBytes(roomKeyHex)
  const iv = forge.random.getBytesSync(16)
  const cipher = forge.cipher.createCipher('AES-GCM', roomKey)
  cipher.start({ iv: forge.util.createBuffer(iv) })
  cipher.update(forge.util.createBuffer(plaintext, 'utf8'))
  cipher.finish()
  return {
    encrypted_content: forge.util.bytesToHex(cipher.output.getBytes()),
    iv: forge.util.bytesToHex(iv),
    auth_tag: forge.util.bytesToHex(cipher.mode.tag.getBytes()),
  }
}

// Расшифровка текста с помощью Room Key (AES-GCM)
export function decryptMessageWithRoomKey(encryptedContent: string, ivHex: string, authTagHex: string, roomKeyHex: string): string {
  const roomKey = forge.util.hexToBytes(roomKeyHex)
  const decipher = forge.cipher.createDecipher('AES-GCM', roomKey)
  decipher.start({
    iv: forge.util.createBuffer(forge.util.hexToBytes(ivHex)),
    tag: forge.util.createBuffer(forge.util.hexToBytes(authTagHex)),
  })
  decipher.update(forge.util.createBuffer(forge.util.hexToBytes(encryptedContent)))
  decipher.finish()
  return decipher.output.toString()
}

// Шифрование строки паролем (AES-GCM, ключ из пароля через SHA-256)
export function encryptWithPassword(plaintext: string, password: string): string {
  const passwordKey = forge.md.sha256.create().update(password).digest().getBytes()
  const iv = forge.random.getBytesSync(16)
  const cipher = forge.cipher.createCipher('AES-GCM', passwordKey)
  cipher.start({ iv: forge.util.createBuffer(iv) })
  cipher.update(forge.util.createBuffer(plaintext, 'utf8'))
  cipher.finish()
  const encrypted = cipher.output.getBytes()
  const tag = cipher.mode.tag.getBytes()
  return JSON.stringify({
    iv: forge.util.bytesToHex(iv),
    content: forge.util.bytesToHex(encrypted),
    tag: forge.util.bytesToHex(tag),
  })
}

// Расшифровка строки паролем
export function decryptWithPassword(encryptedBackup: string, password: string): string | null {
  try {
    const { iv, content, tag } = JSON.parse(encryptedBackup)
    const passwordKey = forge.md.sha256.create().update(password).digest().getBytes()
    const decipher = forge.cipher.createDecipher('AES-GCM', passwordKey)
    decipher.start({
      iv: forge.util.createBuffer(forge.util.hexToBytes(iv)),
      tag: forge.util.createBuffer(forge.util.hexToBytes(tag)),
    })
    decipher.update(forge.util.createBuffer(forge.util.hexToBytes(content)))
    decipher.finish()
    return decipher.output.toString()
  } catch (e) {
    return null
  }
}