library(tidyverse)
library(readxl)
library(survey)

#setwd("~/Documents/personal_repos/personal_website/pubpol750-2022/Week10/")

df <- read_excel("Weights Example Data.xlsx","Sheet1")

wbu <- 7.5/4
wu <- 2.5/6

df$weight <- c(wbu,wu,wbu,wbu,wu,wu,wu,wu,wu,wbu)

marginals <- c(`(Intercept)`= 1,
               "EducationUniversity"=0.25)
tmp_form <- paste(" ~ Education")

surveyDesign <- svydesign(id = ~ 1, 
                          weights = ~ 1,
                          data = df)
surveyDesign <- calibrate(design     = surveyDesign,
                          formula    = as.formula(tmp_form),
                          calfun     = "raking",
                          population = marginals,
                          maxit      = 2000)

df$weight_created_withR <- weights(surveyDesign)

mean(df$weight)
sum(df$weight_created_withR)

df$weight / sum(df$weight)

df$weight_created_withR * nrow(df)

df$weight_created_withR * 31237362

df <- read_excel("Weights Example Data.xlsx","Sheet2")

marginals <- c(`(Intercept)`= 1,
               "EducationUniversity"=0.25,
               "GenderMale"=0.48,
               "GenderOther"=0.02)
tmp_form <- paste(" ~ Education + Gender")

surveyDesign <- svydesign(id = ~ 1, 
                          weights = ~ 1,
                          data = df)
surveyDesign <- calibrate(design     = surveyDesign,
                          formula    = as.formula(tmp_form),
                          calfun     = "raking",
                          population = marginals,
                          maxit      = 2000)

weights(surveyDesign)

weights(surveyDesign) * 10
