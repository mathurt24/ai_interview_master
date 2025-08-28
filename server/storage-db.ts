import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { 
  candidates, 
  interviews, 
  answers, 
  evaluations,
  type Candidate, 
  type InsertCandidate,
  type Interview,
  type InsertInterview,
  type Answer,
  type InsertAnswer,
  type Evaluation,
  type InsertEvaluation,
  users,
  type User,
  type InsertUser,
  settings,
  questionBank,
  auditLogs,
  tokenUsage
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import type { IStorage } from "./storage";

const sql = postgres(process.env.DATABASE_URL!);
const db = drizzle(sql);

type TokenUsageRow = {
  provider: string;
  tokens: number;
  cost: number;
  timestamp: Date;
};

export class DatabaseStorage implements IStorage {
  private passwordResetTokens: Map<string, { email: string; expiry: Date }> | null = null;

  async createCandidate(candidate: InsertCandidate): Promise<Candidate> {
    const [result] = await db.insert(candidates).values(candidate).returning();
    return result;
  }

  async getCandidateById(id: number): Promise<Candidate | undefined> {
    const result = await db.select().from(candidates).where(eq(candidates.id, id));
    return result[0];
  }

  async updateCandidate(id: number, updates: Partial<Candidate>): Promise<Candidate> {
    const [result] = await db.update(candidates).set(updates).where(eq(candidates.id, id)).returning();
    if (!result) throw new Error('Candidate not found');
    return result;
  }

  async createInterview(interview: InsertInterview): Promise<Interview> {
    const [result] = await db.insert(interviews).values({
      ...interview,
      status: interview.status || "pending",
      currentQuestionIndex: interview.currentQuestionIndex || 0
    }).returning();
    return result;
  }

  async getInterviewById(id: number): Promise<Interview | undefined> {
    const result = await db.select().from(interviews).where(eq(interviews.id, id));
    return result[0];
  }

  async getInterviewsByCandidate(candidateId: number): Promise<Interview[]> {
    return await db.select().from(interviews).where(eq(interviews.candidateId, candidateId));
  }

  async updateInterviewStatus(id: number, status: string, currentQuestionIndex?: number): Promise<Interview | undefined> {
    const updateData: Partial<Interview> = { status };
    if (currentQuestionIndex !== undefined) {
      updateData.currentQuestionIndex = currentQuestionIndex;
    }
    
    const [result] = await db.update(interviews)
      .set(updateData)
      .where(eq(interviews.id, id))
      .returning();
    return result;
  }

  async completeInterview(id: number): Promise<Interview | undefined> {
    const [result] = await db.update(interviews)
      .set({ 
        status: "completed",
        completedAt: new Date()
      })
      .where(eq(interviews.id, id))
      .returning();
    return result;
  }

  async createAnswer(answer: InsertAnswer): Promise<Answer> {
    const [result] = await db.insert(answers).values(answer).returning();
    return result;
  }

  async getAnswersByInterview(interviewId: number): Promise<Answer[]> {
    return await db.select().from(answers).where(eq(answers.interviewId, interviewId));
  }

  async createEvaluation(evaluation: InsertEvaluation): Promise<Evaluation> {
    const [result] = await db.insert(evaluations).values(evaluation).returning();
    return result;
  }

  async getEvaluationByInterview(interviewId: number): Promise<Evaluation | undefined> {
    const result = await db.select().from(evaluations).where(eq(evaluations.interviewId, interviewId));
    return result[0];
  }

  async getAllInterviews(): Promise<(Interview & { candidate: Candidate; evaluation?: Evaluation })[]> {
    const result = await db
      .select({
        interview: interviews,
        candidate: candidates,
        evaluation: evaluations
      })
      .from(interviews)
      .leftJoin(candidates, eq(interviews.candidateId, candidates.id))
      .leftJoin(evaluations, eq(interviews.id, evaluations.interviewId))
      .orderBy(desc(interviews.createdAt));

    return result.map(row => ({
      ...row.interview,
      candidate: row.candidate!,
      evaluation: row.evaluation || undefined
    }));
  }

  async getInterviewStats(): Promise<{
    total: number;
    recommended: number;
    maybe: number;
    rejected: number;
    avgScore: number;
  }> {
    const evalResults = await db.select().from(evaluations);
    const total = evalResults.length;
    const recommended = evalResults.filter(e => e.recommendation === "Hire").length;
    const maybe = evalResults.filter(e => e.recommendation === "Maybe").length;
    const rejected = evalResults.filter(e => e.recommendation === "No").length;
    const avgScore = total > 0 ? evalResults.reduce((sum: number, e: Evaluation) => sum + e.overallScore, 0) / total : 0;

    return { total, recommended, maybe, rejected, avgScore: Math.round(avgScore * 10) / 10 };
  }

  async createUser(user: InsertUser): Promise<User> {
    const [result] = await db.insert(users).values(user).returning();
    return result;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async findCandidatesByEmail(email: string): Promise<Candidate[]> {
    return await db.select().from(candidates).where(eq(candidates.email, email));
  }

  async getAllUsers(): Promise<User[]> {
    const result = await db.select().from(users);
    return result;
  }

  async getAllCandidates(): Promise<Candidate[]> {
    const result = await db.select().from(candidates);
    return result;
  }

  async getSetting(key: string): Promise<string | undefined> {
    const result = await db.select().from(settings).where(eq(settings.key, key));
    return result[0]?.value;
  }

  async setSetting(key: string, value: string): Promise<void> {
    const existing = await db.select().from(settings).where(eq(settings.key, key));
    if (existing[0]) {
      await db.update(settings).set({ value }).where(eq(settings.key, key));
    } else {
      await db.insert(settings).values({ key, value });
    }
  }

  async getQuestionsByRole(role: string) {
    return await db.select().from(questionBank).where(eq(questionBank.role, role));
  }

  async saveQuestionToBank({ role, questionText, source }: { role: string, questionText: string, source: string }) {
    await db.insert(questionBank).values({ role, questionText, source });
  }

  async getAllQuestions(): Promise<any[]> {
    const result = await db.select().from(questionBank);
    return result;
  }

  async deleteInterview(id: number): Promise<void> {
    await db.delete(interviews).where(eq(interviews.id, id));
  }

  async deleteCandidate(id: number): Promise<void> {
    await db.delete(candidates).where(eq(candidates.id, id));
  }

  async deleteAnswersByInterview(interviewId: number): Promise<void> {
    await db.delete(answers).where(eq(answers.interviewId, interviewId));
  }

  async deleteEvaluationByInterview(interviewId: number): Promise<void> {
    await db.delete(evaluations).where(eq(evaluations.interviewId, interviewId));
  }

  async disqualifyCandidate(id: number): Promise<void> {
    await db.update(candidates).set({ disqualified: true }).where(eq(candidates.id, id));
  }

  async createAuditLog(log: { action: string; target: string; performedBy: string; timestamp?: Date }) {
    await db.insert(auditLogs).values({
      action: log.action,
      target: log.target,
      performedBy: log.performedBy,
      timestamp: log.timestamp || new Date(),
    });
  }

  async getAuditLogs(filters?: { action?: string; performedBy?: string; date?: string }) {
    let query = db.select().from(auditLogs);
    if (filters) {
      if (filters.action) query = query.where(eq(auditLogs.action, filters.action));
      if (filters.performedBy) query = query.where(eq(auditLogs.performedBy, filters.performedBy));
      if (filters.date) query = query.where(sql`DATE(${auditLogs.timestamp}) = ${filters.date}`);
    }
    return await query;
  }

  async getAllAdmins(): Promise<User[]> {
    return await db.select().from(users).where(eq(users.role, 'admin'));
  }

  async updateAdminRole(email: string, adminRole: string) {
    await db.update(users).set({ adminRole }).where(eq(users.email, email));
  }

  async addAdmin(email: string, password: string, adminRole: string) {
    const [user] = await db.insert(users).values({ email, password, role: 'admin', adminRole, createdAt: new Date() }).returning();
    return user;
  }

  async removeAdmin(email: string) {
    await db.delete(users).where(eq(users.email, email));
  }

  async logTokenUsage(provider: string, tokens: number, cost: number, timestamp?: Date) {
    await db.insert(tokenUsage).values({ provider, tokens, cost, timestamp: timestamp || new Date() });
  }

  async getTokenUsageStats() {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const providers = ['openai', 'gemini'];
    const stats: Record<string, { daily: number; weekly: number; monthly: number; cost: number }> = {};

    for (const provider of providers) {
      const daily: TokenUsageRow[] = await db.select().from(tokenUsage).where(tokenUsage.provider.eq(provider)).where(tokenUsage.timestamp.gte(startOfDay));
      const weekly: TokenUsageRow[] = await db.select().from(tokenUsage).where(tokenUsage.provider.eq(provider)).where(tokenUsage.timestamp.gte(startOfWeek));
      const monthly: TokenUsageRow[] = await db.select().from(tokenUsage).where(tokenUsage.provider.eq(provider)).where(tokenUsage.timestamp.gte(startOfMonth));
      const all: TokenUsageRow[] = await db.select().from(tokenUsage).where(tokenUsage.provider.eq(provider));

      stats[provider] = {
        daily: daily.reduce((sum: number, u: TokenUsageRow) => sum + u.tokens, 0),
        weekly: weekly.reduce((sum: number, u: TokenUsageRow) => sum + u.tokens, 0),
        monthly: monthly.reduce((sum: number, u: TokenUsageRow) => sum + u.tokens, 0),
        cost: all.reduce((sum: number, u: TokenUsageRow) => sum + u.cost, 0),
      };
    }

    return stats;
  }

  // Invitation operations
  async createInvitation(invitation: { 
    candidateId: number | null; 
    email: string; 
    token: string; 
    jobRole: string; 
    skillset: string; 
    status: string;
    candidateInfo?: {
      name: string;
      email: string;
      phone: string;
      resumeText: string;
    };
  }): Promise<any> {
    const [result] = await sql`
      INSERT INTO invitations (candidate_id, email, token, job_role, skillset, status, candidate_info, created_at, updated_at)
      VALUES (${invitation.candidateId}, ${invitation.email}, ${invitation.token}, ${invitation.jobRole}, ${invitation.skillset}, ${invitation.status}, ${JSON.stringify(invitation.candidateInfo)}, NOW(), NOW())
      RETURNING *
    `;
    return result;
  }

  async getInvitationByToken(token: string): Promise<any | undefined> {
    const result = await sql`SELECT * FROM invitations WHERE token = ${token}`;
    return result[0];
  }

  async updateInvitationStatus(token: string, status: string): Promise<void> {
    await sql`
      UPDATE invitations
      SET status = ${status}, updated_at = NOW()
      WHERE token = ${token}
    `;
  }

  async getAllInvitations(): Promise<any[]> {
    return await sql`
      SELECT * FROM invitations ORDER BY created_at DESC
    `;
  }

  async deleteUserByEmail(email: string): Promise<void> {
    await db.delete(users).where(eq(users.email, email));
  }

  // Password reset operations
  async storePasswordResetToken(email: string, token: string, expiry: Date): Promise<void> {
    // For now, we'll store this in memory since we don't have a dedicated table
    // In production, you should create a password_reset_tokens table
    if (!this.passwordResetTokens) {
      this.passwordResetTokens = new Map();
    }
    this.passwordResetTokens.set(token, { email, expiry });
  }

  async validatePasswordResetToken(token: string): Promise<string | null> {
    if (!this.passwordResetTokens) {
      return null;
    }
    
    const tokenData = this.passwordResetTokens.get(token);
    if (!tokenData) {
      return null;
    }
    
    // Check if token is expired
    if (new Date() > tokenData.expiry) {
      this.passwordResetTokens.delete(token);
      return null;
    }
    
    return tokenData.email;
  }

  async updateUserPassword(email: string, hashedPassword: string): Promise<void> {
    await db.update(users).set({ password: hashedPassword }).where(eq(users.email, email));
  }

  async invalidatePasswordResetToken(token: string): Promise<void> {
    if (this.passwordResetTokens) {
      this.passwordResetTokens.delete(token);
    }
  }
}