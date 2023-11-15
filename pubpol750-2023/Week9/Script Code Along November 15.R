library(tidyverse)
library(haven)
df <- read_stata("~/Downloads/DC 2021 v1.dta")

# I want to model the relationship between income (independent variable) and satisfaction with democracy (dependent variable)

table(df$dc21_democratic_sat)
table(as_factor(df$dc21_democratic_sat))
table(df$dc21_income_category)
table(as_factor(df$dc21_income_category))

to_model <- df |>
  mutate(dc21_democratic_sat=as_factor(dc21_democratic_sat),
         dc21_income_category=as_factor(dc21_income_category)) |>
  mutate(democratic_sat_numeric=recode(dc21_democratic_sat,
                                       "Not at all satisfied"=1,
                                       "Not very satisfied"=2,
                                       "Fairly satisfied"=3,
                                       "Very satisfied"=4),
         income_numeric=recode(dc21_income_category,
                               "No income"=0,
                               "$1 to $30,000"=15,
                               "$30,001 to $60,000"=45,
                               "$60,001 to $90,000"=75,
                               "$90,001 to $110,000"=100,
                               "$110,001 to $150,000"=130,
                               "$150,001 to $200,000"=175,
                               "More than $200,000"=250))
  

ggplot(to_model,aes(x=income_numeric,y=democratic_sat_numeric)) +
  geom_point()
ggplot(to_model,aes(x=income_numeric,y=democratic_sat_numeric)) +
  geom_jitter()
ggplot(to_model,aes(x=income_numeric,y=democratic_sat_numeric)) +
  geom_jitter() + geom_smooth(method="lm")

lm_fit <- lm(democratic_sat_numeric~income_numeric,to_model)
summary(lm_fit)

to_model$university <- ifelse(as.numeric(to_model$dc21_education>8),"University","No")

lm_fit <- lm(democratic_sat_numeric~income_numeric+age_in_years+university,to_model)
summary(lm_fit)

library(jtool)

jtools::export_summs(lm_fit, file.name = "~/Desktop/regression_table.docx", to.file = "docx")

library(ggeffects)

marginal_effects <- ggeffect(lm_fit,terms = "income_numeric")
# This is a ggplot plot you can customize as you want

plot(marginal_effects) +
  labs(x="My x axis")

ggplot(to_model,aes(x=income_numeric,y=democratic_sat_numeric)) +
  geom_smooth(method="lm")

plot(ggeffect(lm_fit,terms = "university"))

# Linear probability model

to_model$democratic_sat_numeric_binary <- as.numeric(to_model$democratic_sat_numeric>2)

ggplot(to_model,aes(x=income_numeric,y=democratic_sat_numeric_binary)) +
  geom_jitter(alpha=0.2) + geom_smooth(method = "lm")

lm_fit <- lm(democratic_sat_numeric_binary~income_numeric+age_in_years+university,to_model)
summary(lm_fit)

plot(ggeffect(lm_fit,terms = "income_numeric"))

plot(ggeffect(lm_fit,terms = "university"))

# Categorical predictor

to_model$dc21_education

to_model <- to_model |>
  mutate(education3=recode(as_factor(dc21_education),
                          "No schooling"="HS or below",
                            "Some elementary school"="HS or below",
                            "Completed elementary school"="HS or below",
                            "Some secondary/ high school"="HS or below",
                            "Completed secondary/ high school"="HS or below",
                            "Some technical, community college, CEGEP, College Classique"="College or Trade",
                            "Completed technical, community college, CEGEP, College Classique"="College or Trade",
                            "Some university"="College or Trade",
                            "Bachelor's degree"="University",
                            "Master's degree"="University",
                            "Professional degree or doctorate"="University"))

lm(democratic_sat_numeric~education3,to_model)

to_model <- to_model |>
  mutate(educationCOLLEGE=as.numeric(education3=="College or Trade"),
         educationUniversity=as.numeric(education3=="University"))

lm(democratic_sat_numeric~educationCOLLEGE+educationUniversity,to_model)
