library(lme4)
head(Dyestuff)
# Fixed effects
fit_fe <- lm(Yield~Batch,Dyestuff)
unname(c(fit_fe$coefficients[1],
         fit_fe$coefficients[1]+
           fit_fe$coefficients[2:6]))
# Fixed effects is equal the same as doing a group means
tapply(Dyestuff$Yield, Dyestuff$Batch, mean)
# Random effects
# lmer(Yield~(1|Batch),Dyestuff) and lmer(Yield~1+(1|Batch),Dyestuff) are equivalent
fit_re <- lmer(Yield~(1|Batch),Dyestuff)
# Random effects does partial pooling, it pools everything towards the average
# Random effects is kind of like doing group means with pooling towards the mean
predict(fit_re,newdata=data.frame(Batch=LETTERS[1:6]))
c(fixef(fit_re)+ranef(fit_re)$Batch)[[1]]
tapply(Dyestuff$Yield, Dyestuff$Batch, mean)
# In fixed effects we calculate directly the mean of each group (intercept + how the other groups deviate with a fixed eff coefficient)
# In random effects, we get the grand mean (intercept), then look at how much each group deviates from that mean (ranef)
# Then we treat each ranef as a data point drawn from a normal mu=0 and we calculate only the sd/var of that normal
# So random effects is much much more parsimonious model, but sometimes it's hard to estimate/fit
# Also, random effects has more bias. Above, the predicted averages are actually off (towards the grand mean). 
# You get less variance for more bias.

# In the end, FE and RE can be similar for some data (like a simple block experiment)
# But if we have 10000 respondents, we can't fit fix effects.

# It's complicated to get the numbers in the random effects section
# https://stats.stackexchange.com/questions/68106/understanding-the-variance-of-random-effects-in-lmer-models
(1/6 * sum((arm::se.ranef(fit_re)$Batch)^2)) +
  var(ranef(fit_re)$Batch)
# The Variance of the Residual is the within-subject variance
mean(tapply(Dyestuff$Yield, Dyestuff$Batch, var))

VarCorr(fit_re)[[1]][[1]]
attr(VarCorr(fit_re),"sc")^2

# In the book (p.10) https://stat.ethz.ch/~maechler/MEMo-pages/lMMwR.pdf he gives
# an example of a degerate random effect model
summary(lm(Yield~Batch,Dyestuff))$r.squared
# Here 'Batch' does explain much (at least much less)
summary(lm(Yield~Batch,Dyestuff2))$r.squared
# Variance of Batch is 0
summary(lmer(Yield~(1|Batch),Dyestuff2))
# Here you have a boundary singular message telling you the random effect isn't necessary 
# Here, Bates recommend simply fitting the following, which is equivalent
lm(Yield~1,Dyestuff2)

# Beyond that we can combined fix effects and random effects
# Random intercept for cyl and fixed slope for hp and fixed effect intercept (the overall intercept)
# There's always a fixed effect intercept at minimum, so the moment there's a random something, that why it's "mixed"
lmer(mpg~hp+(1|cyl),mtcars)
# fixed effect intercept, fixed effect slope for hp
# both an intercept and a slope for hp are allowed to vary randomly across levels of cyl.
lmer(mpg ~ hp + (1 + hp|cyl), mtcars)
