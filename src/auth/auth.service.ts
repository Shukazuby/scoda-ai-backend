import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { User, UserDocument } from "./schemas/user.schema";
import { LoginDto } from "./dto/login.dto";
import { SignupDto } from "./dto/signup.dto";
import { UpdateProfileDto } from "./dto/update-profile.dto";

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService
  ) {}

  async signup(signupDto: SignupDto) {
    const { name, email, password } = signupDto;
    

    // Check if user already exists
    const existingUser = await this.userModel.findOne({ email: email.toLowerCase()});
    if (existingUser) {
      throw new ConflictException("User with this email already exists");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user (start with 10 credits by default)
    const user = new this.userModel({
      name,
      email: email.toLowerCase(),
      password: hashedPassword
      // credits: 10,
    });

    await user.save();

    // Generate JWT token
    const payload = { sub: user._id, email: user.email };
    const token = this.jwtService.sign(payload);

    // Return user data without password
    const userObj = user.toObject();
    delete userObj.password;

    return {
      user: userObj,
      token,
    };
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    // Find user
    const user = await this.userModel.findOne({ email: email.toLowerCase() });
    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException("Invalid credentials");
    }

    // Generate JWT token
    const payload = { sub: user._id, email: user.email };
    const token = this.jwtService.sign(payload);

    // Return user data without password
    const userObj = user.toObject();
    delete userObj.password;

    return {
      user: userObj,
      token,
    };
  }

  async getProfile(userId: string) {
    const user = await this.userModel.findById(userId).select("-password");
    if (!user) {
      throw new NotFoundException("User not found");
    }
    return user;
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto) {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException("User not found");
    }

    // Check if email is being changed and if it's already taken
    if (updateProfileDto.email !== user.email) {
      const existingUser = await this.userModel.findOne({
        email: updateProfileDto.email.toLowerCase(),
      });
      if (existingUser) {
        throw new ConflictException("Email already in use");
      }
    }

    user.name = updateProfileDto.name;
    user.email = updateProfileDto.email.toLowerCase();
    await user.save();

    const userObj = user.toObject();
    delete userObj.password;
    return userObj;
  }

  /** Permanently delete the user account. Caller must be authenticated. */
  async deleteAccount(userId: string): Promise<{ message: string }> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException("User not found");
    }
    await this.userModel.findByIdAndDelete(userId);
    return { message: "Account deleted successfully" };
  }
}
