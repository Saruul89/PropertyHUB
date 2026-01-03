/**
 * 入居者用の初期パスワードを生成
 * 8桁の数字ランダム
 */
export function generateInitialPassword(): string {
    const numbers = '0123456789';
    let password = '';

    for (let i = 0; i < 8; i++) {
        password += numbers[Math.floor(Math.random() * numbers.length)];
    }

    return password;
}
