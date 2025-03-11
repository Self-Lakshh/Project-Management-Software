import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Injectable, Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
@Injectable()
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logger = new Logger('RealtimeGateway');
  private activeUsers = new Map<string, { userId: string; name: string; email: string; avatar: string; workspaceId?: string }>();

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token || client.handshake.query.token;
      if (!token) {
        client.disconnect();
        return;
      }

      // Verify JWT
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET || 'pms_core_jwt_secret_token_signature_key',
      });

      // Simple active user registration (mock details or decode from token)
      this.activeUsers.set(client.id, {
        userId: payload.userId,
        name: payload.name || 'Anonymous User',
        email: payload.email,
        avatar: payload.avatar || '',
      });

      this.logger.log(`Client connected: ${client.id} (User: ${payload.userId})`);
    } catch {
      this.logger.log(`Connection authentication failed for client: ${client.id}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const user = this.activeUsers.get(client.id);
    if (user && user.workspaceId) {
      this.activeUsers.delete(client.id);
      this.broadcastWorkspacePresence(user.workspaceId);
    } else {
      this.activeUsers.delete(client.id);
    }
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinWorkspace')
  handleJoinWorkspace(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { workspaceId: string; name: string; avatar: string },
  ) {
    client.join(`workspace:${data.workspaceId}`);
    
    // Update active user details with workspace
    const user = this.activeUsers.get(client.id);
    if (user) {
      user.workspaceId = data.workspaceId;
      user.name = data.name;
      user.avatar = data.avatar || '';
      this.activeUsers.set(client.id, user);
    }

    this.broadcastWorkspacePresence(data.workspaceId);
    this.logger.log(`User joined workspace room: workspace:${data.workspaceId}`);
  }

  @SubscribeMessage('joinTask')
  handleJoinTask(@ConnectedSocket() client: Socket, @MessageBody() data: { taskId: string }) {
    client.join(`task:${data.taskId}`);
    this.logger.log(`User joined task room: task:${data.taskId}`);
  }

  @SubscribeMessage('leaveTask')
  handleLeaveTask(@ConnectedSocket() client: Socket, @MessageBody() data: { taskId: string }) {
    client.leave(`task:${data.taskId}`);
    this.logger.log(`User left task room: task:${data.taskId}`);
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { taskId: string; userId: string; name: string; isTyping: boolean },
  ) {
    client.to(`task:${data.taskId}`).emit('typingStatus', {
      taskId: data.taskId,
      userId: data.userId,
      name: data.name,
      isTyping: data.isTyping,
    });
  }

  // Helper to send general updates to clients
  sendTaskUpdate(workspaceId: string, taskId: string, action: string, metadata: any) {
    this.server.to(`workspace:${workspaceId}`).emit('taskUpdated', {
      taskId,
      action,
      metadata,
    });
  }

  private broadcastWorkspacePresence(workspaceId: string) {
    // Collect all online users in this workspace
    const onlineUsers = Array.from(this.activeUsers.values())
      .filter((u) => u.workspaceId === workspaceId)
      // Remove duplicate users (if logged in from multiple tabs)
      .filter((value, index, self) => self.findIndex((t) => t.userId === value.userId) === index);

    this.server.to(`workspace:${workspaceId}`).emit('presence', onlineUsers);
  }
}
