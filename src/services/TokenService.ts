import { JwtPayload, sign } from 'jsonwebtoken';
import { Config } from '../config';
import { RefreshToken } from '../entity/RefreshToken';
import { Repository } from 'typeorm';
import createHttpError from 'http-errors';
import { User } from '../entity/User';

export class TokenService {
    constructor(private refreshTokenRepository: Repository<RefreshToken>) {}

    generateAccessToken(payload: JwtPayload) {
        let privateKey: string;
        if (!Config.PRIVATE_KEY) {
            const err = createHttpError(500, 'Failed to read private key');
            throw err;
        }
        try {
            privateKey = Config.PRIVATE_KEY;
        } catch (error) {
            const err = createHttpError(500, 'Failed to read private key');
            throw err;
        }
        const accessToken = sign(payload, privateKey, {
            algorithm: 'RS256',
            expiresIn: '1m',
            issuer: 'auth-service',
        });
        return accessToken;
    }

    generateRefreshToken(payload: JwtPayload) {
        const refreshToken = sign(payload, Config.REFRESH_TOKEN_SECRET!, {
            algorithm: 'HS256',
            expiresIn: '1y',
            issuer: 'auth-service',
            jwtid: String(payload.id),
        });
        return refreshToken;
    }

    async persistRefreshToken(user: User) {
        const newRefreshToken = await this.refreshTokenRepository.save({
            user,
            expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365),
        });
        return newRefreshToken;
    }

    async deleteRefreshToken(id: number) {
        return await this.refreshTokenRepository.delete(id);
    }
}
