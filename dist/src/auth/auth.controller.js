"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("./auth.service");
const register_dto_1 = require("./dto/register.dto");
const login_dto_1 = require("./dto/login.dto");
const public_decorator_1 = require("./decorators/public.decorator");
const get_current_user_decorator_1 = require("./decorators/get-current-user.decorator");
const refresh_token_guard_1 = require("./guards/refresh-token.guard");
let AuthController = class AuthController {
    authService;
    constructor(authService) {
        this.authService = authService;
    }
    register(registerDto) {
        return this.authService.register(registerDto);
    }
    login(loginDto) {
        return this.authService.login(loginDto);
    }
    logout(userId) {
        return this.authService.logout(userId);
    }
    refreshTokens(userId, refreshToken) {
        return this.authService.refreshTokens(userId, refreshToken);
    }
    getProfile(userId) {
        return this.authService.getProfile(userId);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('register'),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [register_dto_1.RegisterDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "register", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.Post)('login'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.LoginDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('logout'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, get_current_user_decorator_1.GetCurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "logout", null);
__decorate([
    (0, public_decorator_1.Public)(),
    (0, common_1.UseGuards)(refresh_token_guard_1.RefreshTokenGuard),
    (0, common_1.Post)('refresh'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, get_current_user_decorator_1.GetCurrentUser)('id')),
    __param(1, (0, get_current_user_decorator_1.GetCurrentUser)('refreshToken')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "refreshTokens", null);
__decorate([
    (0, common_1.Get)('profile'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, get_current_user_decorator_1.GetCurrentUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "getProfile", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('api/auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map