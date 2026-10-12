BEGIN TRY

BEGIN TRAN;

-- CreateSchema
IF NOT EXISTS (SELECT * FROM sys.schemas WHERE name = N'dbo') EXEC sp_executesql N'CREATE SCHEMA [dbo];';

-- CreateTable
CREATE TABLE [dbo].[user] (
    [id] NVARCHAR(255) NOT NULL,
    [name] NVARCHAR(max) NOT NULL,
    [email] NVARCHAR(320) NOT NULL,
    [emailVerified] BIT NOT NULL CONSTRAINT [user_emailVerified_df] DEFAULT 0,
    [image] NVARCHAR(max),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [user_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [user_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [user_email_key] UNIQUE NONCLUSTERED ([email])
);

-- CreateTable
CREATE TABLE [dbo].[session] (
    [id] NVARCHAR(255) NOT NULL,
    [expiresAt] DATETIME2 NOT NULL,
    [token] NVARCHAR(255) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [session_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [ipAddress] NVARCHAR(max),
    [userAgent] NVARCHAR(max),
    [userId] NVARCHAR(255) NOT NULL,
    CONSTRAINT [session_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [session_token_key] UNIQUE NONCLUSTERED ([token])
);

-- CreateTable
CREATE TABLE [dbo].[account] (
    [id] NVARCHAR(255) NOT NULL,
    [accountId] NVARCHAR(max) NOT NULL,
    [providerId] NVARCHAR(max) NOT NULL,
    [userId] NVARCHAR(255) NOT NULL,
    [accessToken] NVARCHAR(max),
    [refreshToken] NVARCHAR(max),
    [idToken] NVARCHAR(max),
    [accessTokenExpiresAt] DATETIME2,
    [refreshTokenExpiresAt] DATETIME2,
    [scope] NVARCHAR(max),
    [password] NVARCHAR(max),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [account_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [account_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[verification] (
    [id] NVARCHAR(255) NOT NULL,
    [identifier] NVARCHAR(450) NOT NULL,
    [value] NVARCHAR(max) NOT NULL,
    [expiresAt] DATETIME2 NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [verification_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [verification_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[shop] (
    [id] NVARCHAR(255) NOT NULL,
    [name] NVARCHAR(max) NOT NULL,
    [slug] NVARCHAR(max),
    [address] NVARCHAR(max),
    [phone] NVARCHAR(max),
    [currency] NVARCHAR(max) NOT NULL CONSTRAINT [shop_currency_df] DEFAULT 'USD',
    [userId] NVARCHAR(255) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [shop_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [shop_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[products] (
    [id] NVARCHAR(255) NOT NULL,
    [shopId] NVARCHAR(255) NOT NULL,
    [userId] NVARCHAR(255),
    [p_name] NVARCHAR(max) NOT NULL,
    [p_price] FLOAT(53) NOT NULL,
    [p_stock] INT NOT NULL,
    [p_thumbnail] NVARCHAR(max),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [products_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [products_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[sales] (
    [id] NVARCHAR(255) NOT NULL,
    [shopId] NVARCHAR(255) NOT NULL,
    [userId] NVARCHAR(255),
    [cust_name] NVARCHAR(max) NOT NULL,
    [cust_email] NVARCHAR(max) NOT NULL,
    [cust_contact] NVARCHAR(max),
    [cartItems] NVARCHAR(max) NOT NULL CONSTRAINT [sales_cartItems_df] DEFAULT '[]',
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [sales_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [sales_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [session_userId_idx] ON [dbo].[session]([userId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [account_userId_idx] ON [dbo].[account]([userId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [verification_identifier_idx] ON [dbo].[verification]([identifier]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [shop_userId_idx] ON [dbo].[shop]([userId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [products_shopId_idx] ON [dbo].[products]([shopId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [products_userId_idx] ON [dbo].[products]([userId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [sales_shopId_idx] ON [dbo].[sales]([shopId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [sales_userId_idx] ON [dbo].[sales]([userId]);

-- AddForeignKey
ALTER TABLE [dbo].[session] ADD CONSTRAINT [session_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[user]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[account] ADD CONSTRAINT [account_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[user]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[shop] ADD CONSTRAINT [shop_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[user]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[products] ADD CONSTRAINT [products_shopId_fkey] FOREIGN KEY ([shopId]) REFERENCES [dbo].[shop]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[products] ADD CONSTRAINT [products_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[user]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[sales] ADD CONSTRAINT [sales_shopId_fkey] FOREIGN KEY ([shopId]) REFERENCES [dbo].[shop]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[sales] ADD CONSTRAINT [sales_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[user]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- Staff module (shop_members, shop_invitations)
CREATE TABLE [dbo].[shop_members] (
    [id] NVARCHAR(255) NOT NULL,
    [shopId] NVARCHAR(255) NOT NULL,
    [userId] NVARCHAR(255) NOT NULL,
    [role] NVARCHAR(50) NOT NULL,
    [experienceYears] INT,
    [employmentType] NVARCHAR(50),
    [invitedById] NVARCHAR(255),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [shop_members_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [shop_members_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [shop_members_userId_key] UNIQUE NONCLUSTERED ([userId])
);

CREATE TABLE [dbo].[shop_invitations] (
    [id] NVARCHAR(255) NOT NULL,
    [shopId] NVARCHAR(255) NOT NULL,
    [email] NVARCHAR(320) NOT NULL,
    [name] NVARCHAR(max) NOT NULL,
    [role] NVARCHAR(50) NOT NULL,
    [tokenHash] NVARCHAR(64) NOT NULL,
    [status] NVARCHAR(20) NOT NULL CONSTRAINT [shop_invitations_status_df] DEFAULT 'pending',
    [expiresAt] DATETIME2 NOT NULL,
    [invitedById] NVARCHAR(255) NOT NULL,
    [acceptedAt] DATETIME2,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [shop_invitations_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [shop_invitations_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [shop_invitations_tokenHash_key] UNIQUE NONCLUSTERED ([tokenHash])
);

CREATE NONCLUSTERED INDEX [shop_members_shopId_idx] ON [dbo].[shop_members]([shopId]);
CREATE NONCLUSTERED INDEX [shop_invitations_shopId_status_idx] ON [dbo].[shop_invitations]([shopId], [status]);
CREATE NONCLUSTERED INDEX [shop_invitations_email_idx] ON [dbo].[shop_invitations]([email]);

ALTER TABLE [dbo].[shop_members] ADD CONSTRAINT [shop_members_shopId_fkey] FOREIGN KEY ([shopId]) REFERENCES [dbo].[shop]([id]) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE [dbo].[shop_members] ADD CONSTRAINT [shop_members_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[user]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[shop_members] ADD CONSTRAINT [shop_members_invitedById_fkey] FOREIGN KEY ([invitedById]) REFERENCES [dbo].[user]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
ALTER TABLE [dbo].[shop_invitations] ADD CONSTRAINT [shop_invitations_shopId_fkey] FOREIGN KEY ([shopId]) REFERENCES [dbo].[shop]([id]) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE [dbo].[shop_invitations] ADD CONSTRAINT [shop_invitations_invitedById_fkey] FOREIGN KEY ([invitedById]) REFERENCES [dbo].[user]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
