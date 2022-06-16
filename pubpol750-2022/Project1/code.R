library(tidyverse)
library(readstata13)
library(e1071)
library(kableExtra)

df <- read.dta13("~/Downloads/2019 Canadian Election Study - Phone Survey v1.0.dta")

ggplot(df,aes(x=age)) +
  geom_histogram()

sample_size_age <- sum(!is.na(df$age))
my_mean <- mean(df$age,na.rm=TRUE)
my_median <- median(df$age,na.rm=TRUE)

ggplot(df,aes(x=age)) +
  geom_histogram(binwidth=1,fill="white",color="black") +
  theme_classic() +
  labs(x="Age",y="Count (in survey)",title="Age distribution in Canada",
       caption=paste0("Data from CES 2019; n = ",format(sample_size_age,big.mark   = ","))) +
  geom_vline(aes(xintercept=my_mean),linetype=2) +
  annotate("text", x = my_mean-2, y = 90, label = "mean",angle = 90)

table(df$age_range,useNA = "always")
  
ggplot(df,aes(x=age_range)) +
  geom_bar()

table(df$age)

df <- df %>%
  mutate(age_group=cut(age,breaks=c(-Inf,17,34,54,Inf),
                       label=c("0-17","18-34","35-54","55+")),
         age_group=droplevels(age_group))

ggplot(df,aes(x=age_group)) +
  geom_bar() + labs(x="",y="")

ggplot(df,aes(x=age_group)) +
  geom_bar() + labs(x="",y="") +
  geom_text(aes(label = ..count..), stat = "count", vjust = 1.5, colour = "white")

df <- df %>%
  mutate(age_range = droplevels(age_range))

levels(df$age_range)

df <- df %>% 
  mutate(age_range=fct_recode(age_range,
                              "18-24 ans"="(1) 18-24 years old",
                              "25-34 ans"="(2) 25-34 years old",
                              "35-44 ans"="(3) 35-44 years old",
                              "45-54 ans"="(4) 45-54 years old",
                              "55+"="(5) 55+ years old"))

df <- df %>% 
  mutate(age_range=recode(age_range,
                          "(1) 18-24 years old"="18-24 ans",
                          "(2) 25-34 years old"="25-34 ans",
                          "(3) 35-44 years old"="35-44 ans",
                          "(4) 45-54 years old"="45-54 ans",
                          "(5) 55+ years old"="55+"))

ggplot(df,aes(x=age_range)) +
  geom_bar() +
  labs(x="",y="")

age_summary <- df %>%
  summarize(mean_age = mean(age, na.rm = TRUE), 
            sd_age = sd(age, na.rm = TRUE), 
            min_age = min(age, na.rm = TRUE), 
            max_age = max(age, na.rm = TRUE), 
            median_age = median(age, na.rm = TRUE), 
            skew_age = skewness(age, na.rm = TRUE), 
            kurtosis_age = kurtosis(age, na.rm = TRUE), 
            n_age =  sum(!is.na(age)))

age_summary %>%
  kable(format = "simple") 

age_summary %>%
  t() %>%
  kable(format = "simple") 

table(df$q11,useNA = "always")
table(df$q12,useNA = "always")
table(df$q12,df$q11,useNA = "always")

df %>% filter(!is.na(q12)) %>% pull(q11) %>% table(useNA = "always")

df <- df %>%
  mutate(vote_coalesced = coalesce(q12,q11))

table(df$vote_coalesced,useNA = "always")

my_mapping <- c("(-9) Don't know"="DK",
  "(-8) Refused"="OTH",
  "(-7) Skipped"="OTH",
  "(1) Liberal (Grits)"="LIB", 
  "(2) Conservatives (Tory, PCs, Conservative Party of Canada)"="CONS", 
  "(3) NDP (New Democratic Party, New Democrats, NDPers)"="NDP",
  "(4) Bloc QuÃ©bÃ©cois (BQ, PQ, Bloc, Parti QuÃ©bÃ©cois)"="BQ", 
  "(5) Green Party (Greens)"="GRN",
  "(6) People's Party"="PPC",
  "(7) Other"="OTH", 
  "(8) Will not vote"="OTH",
  "(9) None of these"="OTH",
  "(10) Will spoil ballet"="OTH", 
  "(-9) Don't know / Undecided"="DK")

df <- df %>%
  mutate(vote_clean=recode(vote_coalesced,!!!my_mapping))

dput(levels(df$vote_clean))

df <- df %>%
  mutate(vote_clean = factor(vote_clean,c("LIB", "CONS", "NDP", "BQ", "GRN", "PPC","DK", "OTH")))
party_colors <- c("LIB"="red",
  "CONS"="darkblue",
  "NDP"="orange",
  "BQ"="lightblue",
  "GRN"="darkgreen",
  "PPC"="purple",
  "DK"="darkgrey",
  "OTH"="grey")

ggplot(df,aes(x=vote_clean,fill=vote_clean)) +
  geom_bar() + labs(x="",y="") +
  scale_fill_manual(values=party_colors) +
  theme(legend.position = "none")

ggplot(df,aes(x=age,fill=vote_clean)) +
  geom_histogram() +
  theme(legend.position = "none") +
  facet_wrap(~vote_clean) +
  scale_fill_manual(values=party_colors)

age_vote_summary <- df %>%
  group_by(vote_clean) %>%
  summarize(mean_age = mean(age, na.rm = TRUE), 
            sd_age = sd(age, na.rm = TRUE), 
            min_age = min(age, na.rm = TRUE), 
            max_age = max(age, na.rm = TRUE), 
            median_age = median(age, na.rm = TRUE), 
            skew_age = skewness(age, na.rm = TRUE), 
            kurtosis_age = kurtosis(age, na.rm = TRUE), 
            n_age =  sum(!is.na(age)))

age_vote_summary

age_vote_summary %>%
  kable(format = "simple", digits=2) 

ggplot(df,aes(x=q46)) +
  geom_bar()

my_mapping <- c("(-9) Don't know"=NA,
  "(-8) Refused"=NA,
  "(-7) Skipped"=NA,
  "(1) Strongly agree"=1, 
  "(2) Somewhat agree"=2,
  "(3) Somewhat disagree"=3,
  "(4) Strongly disagree"=4
)

df <- df %>%
  mutate(q46_numeric=recode(q46,!!!my_mapping))

ggplot(df,aes(x=q46_numeric)) +
  geom_bar()

my_mean <- mean(df$q46_numeric,na.rm=TRUE)
my_median <- median(df$q46_numeric,na.rm=TRUE)

ggplot(df,aes(x=q46_numeric)) +
  geom_histogram() +
  geom_vline(aes(xintercept=my_mean),linetype=2) +
  annotate("text", x = my_mean, y = 90, label = "mean",angle = 90) +
  geom_vline(aes(xintercept=my_median),linetype=2) +
  annotate("text", x = my_median, y = 90, label = "median",angle = 90)

